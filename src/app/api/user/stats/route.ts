import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import Match from "@/models/Match"; // Ensure Match model is registered
import User from "@/models/User";   // Ensure User model is registered
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

        if (req.nextUrl.searchParams.get("detailed") === "true") {
            // "Detailed" stats for the profile page
            const detailedStats = await UserMatchStats.find({ userId })
                .populate({
                    path: 'matchId',
                    select: 'startTime teams venue status'
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

                    if (winnerId && numParticipants > 1) {
                        if (winnerId === userIdStr) {
                            // User Won
                            const gain = (numParticipants - 1) * 50;
                            netWorth += gain;
                            pnl = gain;
                            outcome = 'win';

                            players.forEach(p => {
                                const pid = String(p._id);
                                if (pid === userIdStr) return;
                                if (!ledger[pid]) ledger[pid] = { userId: pid, name: p.name, amount: 0, matches: [] };
                                ledger[pid].amount += 50;
                                ledger[pid].matches.push({ matchId: mid, amount: 50, type: 'gain', date: stat.matchId.startTime });
                            });
                        } else {
                            // User Lost
                            netWorth -= 50;
                            pnl = -50;
                            outcome = 'loss';

                            const winner = players.find(p => String(p._id) === winnerId);
                            if (winner) {
                                const pid = String(winner._id);
                                if (!ledger[pid]) ledger[pid] = { userId: pid, name: winner.name, amount: 0, matches: [] };
                                ledger[pid].amount -= 50;
                                ledger[pid].matches.push({ matchId: mid, amount: -50, type: 'loss', date: stat.matchId.startTime });
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
            { $match: { userId: userId } },
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
        const userStatsDocs = await UserMatchStats.find({ userId }).select('matchId').lean();
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
                    netWorth += (numParticipants - 1) * 50;
                } else {
                    netWorth -= 50;
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