import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import User from "@/models/User";
import mongoose from "mongoose";

function getWeekBoundaries(date: Date) {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sun) to 6 (Sat)
    // Week starts on Friday (5)
    let diff = day - 5;
    if (diff < 0) diff += 7;

    const start = new Date(d);
    start.setDate(d.getDate() - diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        start,
        end,
        label: `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric' })}`
    };
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 1. Fetch all users
        const allUsers = await User.find({}).select("name image").lean();
        const userMap = new Map(allUsers.map(u => [String(u._id), u]));

        // 2. Fetch all match stats
        const allStats = await UserMatchStats.find({})
            .populate({
                path: 'matchId',
                select: 'startTime teams venue status'
            })
            .sort({ 'matchId.startTime': -1 })
            .lean();

        if (!allStats.length) {
            return NextResponse.json({ weeks: [] });
        }

        const matchIds = [...new Set(allStats.map(s => String(s.matchId._id)))];

        // 3. Fetch winners for these matches
        const winners = await UserMatchStats.aggregate([
            { $match: { matchId: { $in: matchIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            { $sort: { totalRuns: -1, totalBalls: 1 } },
            {
                $group: {
                    _id: "$matchId",
                    winnerId: { $first: "$userId" }
                }
            }
        ]);
        const winnersMap = new Map(winners.map(w => [String(w._id), String(w.winnerId)]));

        // 4. Fetch participants for these matches
        const participants = await UserBattingAssignment.find({ matchId: { $in: matchIds.map(id => new mongoose.Types.ObjectId(id)) } })
            .populate('userId', 'name')
            .lean();

        const matchParticipants: Record<string, any[]> = {};
        participants.forEach(p => {
            const mid = String(p.matchId);
            if (!matchParticipants[mid]) matchParticipants[mid] = [];
            matchParticipants[mid].push(p.userId);
        });

        // 5. Group by Week and then by User
        const weeks: Record<string, any> = {};

        for (const stat of allStats) {
            if (!stat.matchId) continue;

            const matchDate = new Date((stat.matchId as any).startTime);
            const { start, label } = getWeekBoundaries(matchDate);
            const weekKey = start.getTime().toString();

            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    key: weekKey,
                    label,
                    startDate: start,
                    userData: {} // userId -> { name, stats, matches, ledger }
                };
            }

            const week = weeks[weekKey];
            const userIdStr = String(stat.userId);
            const user = userMap.get(userIdStr);
            if (!user) continue;

            if (!week.userData[userIdStr]) {
                week.userData[userIdStr] = {
                    userId: userIdStr,
                    name: user.name,
                    image: user.image,
                    stats: {
                        runs: 0,
                        balls: 0,
                        wins: 0,
                        losses: 0,
                        netWorth: 0
                    },
                    matches: [],
                    ledger: {} // otherUserId -> amount
                };
            }

            const uData = week.userData[userIdStr];
            const mid = String(stat.matchId._id);
            const winnerId = winnersMap.get(mid);
            const players = matchParticipants[mid] || [];
            const numParticipants = players.length;

            let pnl = 0;
            let outcome = 'played';

            if (winnerId && numParticipants > 1) {
                if (winnerId === userIdStr) {
                    pnl = (numParticipants - 1) * 50;
                    outcome = 'win';
                    uData.stats.wins++;
                } else {
                    pnl = -50;
                    outcome = 'loss';
                    uData.stats.losses++;
                }
            }

            uData.stats.runs += stat.totalRuns;
            uData.stats.balls += stat.totalBalls;
            uData.stats.netWorth += pnl;

            // Ledger updates
            if (pnl !== 0) {
                if (outcome === 'win') {
                    players.forEach(p => {
                        const pid = String(p._id);
                        if (pid === userIdStr) return;
                        if (!uData.ledger[pid]) uData.ledger[pid] = { name: p.name, amount: 0 };
                        uData.ledger[pid].amount += 50;
                    });
                } else {
                    const winner = players.find(p => String(p._id) === winnerId);
                    if (winner) {
                        const pid = String(winner._id);
                        if (!uData.ledger[pid]) uData.ledger[pid] = { name: winner.name, amount: 0 };
                        uData.ledger[pid].amount -= 50;
                    }
                }
            }

            uData.matches.push({
                matchId: mid,
                date: (stat.matchId as any).startTime,
                venue: (stat.matchId as any).venue,
                runs: stat.totalRuns,
                balls: stat.totalBalls,
                pnl,
                outcome
            });
        }

        // Final formatting
        const formattedWeeks = Object.values(weeks)
            .sort((a: any, b: any) => b.startDate.getTime() - a.startDate.getTime())
            .map((w: any) => ({
                ...w,
                users: Object.values(w.userData).map((u: any) => ({
                    ...u,
                    stats: {
                        ...u.stats,
                        average: u.matches.length > 0 ? (u.stats.runs / u.matches.length).toFixed(1) : "0.0",
                        strikeRate: u.stats.balls > 0 ? ((u.stats.runs / u.stats.balls) * 100).toFixed(1) : "0.0"
                    },
                    ledger: Object.entries(u.ledger).map(([id, lData]: [string, any]) => ({
                        userId: id,
                        name: lData.name,
                        amount: lData.amount
                    })).sort((a, b) => b.amount - a.amount)
                })).sort((a, b) => b.stats.netWorth - a.stats.netWorth) // Sort by P&L
            }));

        return NextResponse.json({ weeks: formattedWeeks });

    } catch (error: any) {
        console.error("Admin Weekly Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
