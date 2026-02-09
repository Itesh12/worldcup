import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import Match from "@/models/Match";
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
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userIdStr = (session.user as any).id;

        if (!userIdStr || !mongoose.Types.ObjectId.isValid(userIdStr)) {
            return NextResponse.json({ error: "Invalid User ID" }, { status: 400 });
        }

        const userId = new mongoose.Types.ObjectId(userIdStr);

        // 1. Fetch all match stats for this user
        const userStats = await UserMatchStats.find({ userId })
            .populate({
                path: 'matchId',
                select: 'startTime teams venue status'
            })
            .sort({ 'matchId.startTime': -1 })
            .lean();

        if (!userStats.length) {
            return NextResponse.json({ weeks: [] });
        }

        const matchIds = userStats.map(s => s.matchId._id);

        // 2. Fetch winners for these matches
        const winners = await UserMatchStats.aggregate([
            { $match: { matchId: { $in: matchIds } } },
            { $sort: { totalRuns: -1, totalBalls: 1 } },
            {
                $group: {
                    _id: "$matchId",
                    winnerId: { $first: "$userId" }
                }
            }
        ]);
        const winnersMap = new Map(winners.map(w => [String(w._id), String(w.winnerId)]));

        // 3. Fetch participants for these matches
        const participants = await UserBattingAssignment.find({ matchId: { $in: matchIds } })
            .populate('userId', 'name')
            .lean();

        const matchParticipants: Record<string, any[]> = {};
        participants.forEach(p => {
            const mid = String(p.matchId);
            if (!matchParticipants[mid]) matchParticipants[mid] = [];
            matchParticipants[mid].push(p.userId);
        });

        // 4. Group by week
        const weeks: Record<string, any> = {};

        for (const stat of userStats) {
            const matchDate = new Date((stat.matchId as any).startTime);
            const { start, label } = getWeekBoundaries(matchDate);
            const weekKey = start.getTime().toString();

            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    key: weekKey,
                    label,
                    startDate: start,
                    matches: [],
                    stats: {
                        runs: 0,
                        balls: 0,
                        wins: 0,
                        losses: 0,
                        netWorth: 0
                    },
                    ledger: {} // userId -> { name, amount }
                };
            }

            const week = weeks[weekKey];
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
                    week.stats.wins++;
                } else {
                    pnl = -50;
                    outcome = 'loss';
                    week.stats.losses++;
                }
            }

            // Update week-level stats
            week.stats.runs += stat.totalRuns;
            week.stats.balls += stat.totalBalls;
            week.stats.netWorth += pnl;

            // Update ledger
            if (pnl !== 0) {
                if (outcome === 'win') {
                    // Collect from everyone else
                    players.forEach(p => {
                        const pid = String(p._id);
                        if (pid === userIdStr) return;
                        if (!week.ledger[pid]) week.ledger[pid] = { name: p.name, amount: 0 };
                        week.ledger[pid].amount += 50;
                    });
                } else {
                    // Pay to winner
                    const winner = players.find(p => String(p._id) === winnerId);
                    if (winner) {
                        const pid = String(winner._id);
                        if (!week.ledger[pid]) week.ledger[pid] = { name: winner.name, amount: 0 };
                        week.ledger[pid].amount -= 50;
                    }
                }
            }

            week.matches.push({
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
        const sortedWeeks = Object.values(weeks)
            .sort((a: any, b: any) => b.startDate.getTime() - a.startDate.getTime())
            .map((w: any) => ({
                ...w,
                stats: {
                    ...w.stats,
                    average: w.matches.length > 0 ? (w.stats.runs / w.matches.length).toFixed(1) : "0.0",
                    strikeRate: w.stats.balls > 0 ? ((w.stats.runs / w.stats.balls) * 100).toFixed(1) : "0.0"
                },
                ledger: Object.entries(w.ledger).map(([id, data]: [string, any]) => ({
                    userId: id,
                    name: data.name,
                    amount: data.amount
                })).sort((a, b) => b.amount - a.amount)
            }));

        return NextResponse.json({ weeks: sortedWeeks });

    } catch (error: any) {
        console.error("Weekly Report API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
