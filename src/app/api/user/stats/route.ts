import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import Match from "@/models/Match"; // Ensure Match model is registered
import User from "@/models/User";   // Ensure User model is registered
import Tournament from "@/models/Tournament";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userIdStr = (session.user as any).id;

        if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
            return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
        }

        const userId = new mongoose.Types.ObjectId(userIdStr);
        const tournamentIdStr = req.nextUrl.searchParams.get('tournamentId');

        if (!tournamentIdStr || !mongoose.Types.ObjectId.isValid(tournamentIdStr)) {
            return NextResponse.json({ error: "Invalid or missing Tournament ID" }, { status: 400 });
        }

        const tournamentId = new mongoose.Types.ObjectId(tournamentIdStr);
        const tournament = await Tournament.findById(tournamentId).lean() as any;
        
        if (!tournament) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        const ENTRY_FEE = tournament.entryFee || 50;
        const COMMISSION_PCT = tournament.commissionPercentage || 0;

        if (req.nextUrl.searchParams.get("detailed") === "true") {
            // "Detailed" stats for the profile page
            const detailedStats = await UserMatchStats.find({ userId, tournamentId })
                .populate({
                    path: 'matchId',
                    select: 'startTime teams venue status entryFee commissionPercentage'
                })
                .sort({ updatedAt: -1 }) // Most recent first
                .lean();

            // Calculate aggregated metrics
            const totalRuns = detailedStats.reduce((acc, curr) => acc + (curr.totalRuns || 0), 0);
            const totalBalls = detailedStats.reduce((acc, curr) => acc + (curr.totalBalls || 0), 0);
            const matchesPlayed = detailedStats.length;

            // Avoid division by zero
            const strikeRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 100).toFixed(2) : "0.00";
            const average = matchesPlayed > 0 ? (totalRuns / matchesPlayed).toFixed(2) : "0.00";

            // --- Net Worth Breakdown & Match Outcome Logic ---
            const matchIds = detailedStats.map(s => s.matchId._id);
            let netWorth = 0;
            const ledger: Record<string, { userId: string, name: string, amount: number, matches: any[] }> = {};
            const matchOutcomes: Record<string, { pnl: number, outcome: 'win' | 'loss' | 'played' }> = {};

            if (matchIds.length > 0) {
                // Find winners
                const winners = await UserMatchStats.aggregate([
                    {
                        $match: {
                            matchId: { $in: matchIds },
                            totalRuns: { $gt: 0 }
                        }
                    },
                    { $sort: { totalRuns: -1, totalBalls: 1 } },
                    {
                        $group: {
                            _id: "$matchId",
                            winnerId: { $first: "$userId" }
                        }
                    }
                ]);

                // Get all participants with names
                const participants = await UserBattingAssignment.find({ matchId: { $in: matchIds } })
                    .populate('userId', 'name')
                    .lean();

                const winnersMap = new Map(winners.map(w => [String(w._id), String(w.winnerId)]));

                // Group participants by match
                const matchParticipants: Record<string, any[]> = {};
                participants.forEach(p => {
                    const mid = String(p.matchId);
                    if (!matchParticipants[mid]) matchParticipants[mid] = [];
                    matchParticipants[mid].push(p.userId);
                });

                for (const stat of detailedStats) {
                    const mid = String(stat.matchId._id);
                    const winnerId = winnersMap.get(mid);
                    const players = matchParticipants[mid] || [];
                    const numParticipants = players.length;

                    let pnl = 0;
                    let outcome: 'win' | 'loss' | 'played' = 'played';

                    const currentEntryFee = stat.matchId.entryFee || ENTRY_FEE;
                    const currentCommissionPct = stat.matchId.commissionPercentage ?? COMMISSION_PCT;

                    if (winnerId && numParticipants > 1) {
                        const totalPool = numParticipants * currentEntryFee;
                        const adminCommission = totalPool * (currentCommissionPct / 100);
                        const winnerPrize = totalPool - adminCommission;

                        if (winnerId === userIdStr) {
                            // User Won
                            const gain = winnerPrize - currentEntryFee; // Profit after their own entry fee
                            netWorth += gain;
                            pnl = gain;
                            outcome = 'win';

                            players.forEach(p => {
                                const pid = String(p._id);
                                if (pid === userIdStr) return;
                                if (!ledger[pid]) ledger[pid] = { userId: pid, name: p.name, amount: 0, matches: [] };
                                // Ledger records how much this person 'cost' you or 'paid' you
                                // In a commission model, they paid their ENTRY_FEE, but you got slightly less than the sum
                                // We'll keep the ledger simple: they paid the ENTRY_FEE.
                                ledger[pid].amount += currentEntryFee;
                                ledger[pid].matches.push({ matchId: mid, amount: currentEntryFee, type: 'gain', date: stat.matchId.startTime });
                            });
                        } else {
                            // User Lost
                            netWorth -= currentEntryFee;
                            pnl = -currentEntryFee;
                            outcome = 'loss';

                            const winner = players.find(p => String(p._id) === winnerId);
                            if (winner) {
                                const pid = String(winner._id);
                                if (!ledger[pid]) ledger[pid] = { userId: pid, name: (winner as any).name, amount: 0, matches: [] };
                                ledger[pid].amount -= currentEntryFee;
                                ledger[pid].matches.push({ matchId: mid, amount: currentEntryFee, type: 'loss', date: stat.matchId.startTime });
                            }
                        }
                    }

                    matchOutcomes[mid] = { pnl, outcome };
                }
            }

            // Format match history for the frontend
            const matchHistory = detailedStats.map((stat: any) => {
                const mid = String(stat.matchId._id);
                const outcomeData = matchOutcomes[mid] || { pnl: 0, outcome: 'played' };

                return {
                    matchId: stat.matchId._id,
                    date: stat.matchId.startTime,
                    opponent: "TBD",
                    teams: stat.matchId.teams,
                    venue: stat.matchId.venue,
                    runs: stat.totalRuns,
                    balls: stat.totalBalls,
                    strikeRate: stat.totalBalls > 0 ? ((stat.totalRuns / stat.totalBalls) * 100).toFixed(1) : "0.0",
                    outcome: outcomeData.outcome,
                    pnl: outcomeData.pnl
                };
            });

            // Find highest score
            const highestScore = detailedStats.reduce((max, curr) => (curr.totalRuns > max ? curr.totalRuns : max), 0);

            return NextResponse.json({
                overview: {
                    matches: matchesPlayed,
                    runs: totalRuns,
                    balls: totalBalls,
                    average,
                    strikeRate,
                    highestScore,
                    netWorth
                },
                ledger: Object.values(ledger).sort((a, b) => b.amount - a.amount),
                history: matchHistory
            });
        }

        // --- Original Dashboard Summary Logic (Preserved) ---

        // 1. Get User's Total Stats
        const userStatsAgg = await UserMatchStats.aggregate([
            { $match: { userId: userId, tournamentId: tournamentId } },
            {
                $group: {
                    _id: "$userId",
                    totalRuns: { $sum: "$totalRuns" },
                    totalBalls: { $sum: "$totalBalls" }
                }
            }
        ]);

        const userStats = userStatsAgg[0] || { totalRuns: 0, totalBalls: 0 };

        // 2. Calculate Global Rank
        // We aggregate runs per user and see how many users have more runs than the current user
        const globalRankAgg = await UserMatchStats.aggregate([
            { $match: { tournamentId: tournamentId } },
            {
                $group: {
                    _id: "$userId",
                    totalRuns: { $sum: "$totalRuns" }
                }
            },
            {
                $match: {
                    totalRuns: { $gt: userStats.totalRuns }
                }
            },
            { $count: "usersAbove" }
        ]);

        const rank = (globalRankAgg[0]?.usersAbove || 0) + 1;

        // 3. Calculate Net Worth
        // Logic: For each match played, if won: +(Opponents)*50, if lost: -50
        const userStatsDocs = await UserMatchStats.find({ userId, tournamentId }).select('matchId').lean();
        const participatedMatchIds = userStatsDocs.map(s => s.matchId);

        let netWorth = 0;

        if (participatedMatchIds.length > 0) {
            // Find winners for all these matches in one go
            const winners = await UserMatchStats.aggregate([
                {
                    $match: {
                        matchId: { $in: participatedMatchIds },
                        totalRuns: { $gt: 0 }
                    }
                },
                { $sort: { totalRuns: -1, totalBalls: 1 } },
                {
                    $group: {
                        _id: "$matchId",
                        winnerId: { $first: "$userId" }
                    }
                }
            ]);

            // Get participant counts for all matches in one go
            const counts = await UserBattingAssignment.aggregate([
                { $match: { matchId: { $in: participatedMatchIds } } },
                {
                    $group: {
                        _id: "$matchId",
                        users: { $addToSet: "$userId" }
                    }
                },
                {
                    $project: {
                        count: { $size: "$users" }
                    }
                }
            ]);

            const winnersMap = new Map(winners.map(w => [String(w._id), String(w.winnerId)]));
            const countsMap = new Map(counts.map(c => [String(c._id), Number(c.count)]));

            for (const mId of participatedMatchIds) {
                const midStr = String(mId);
                const winnerId = winnersMap.get(midStr);
                const numParticipants = countsMap.get(midStr) || 0;

                if (!winnerId || numParticipants <= 1) continue;

                if (winnerId === userIdStr) {
                    const totalPool = numParticipants * ENTRY_FEE;
                    const adminCommission = totalPool * (COMMISSION_PCT / 100);
                    const winnerPrize = totalPool - adminCommission;
                    netWorth += (winnerPrize - ENTRY_FEE);
                } else {
                    netWorth -= ENTRY_FEE;
                }
            }
        }

        return NextResponse.json({
            totalRuns: userStats.totalRuns,
            totalBalls: userStats.totalBalls,
            rank: rank,
            netWorth: netWorth
        });

    } catch (error: any) {
        console.error("User Stats API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}