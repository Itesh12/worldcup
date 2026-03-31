import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Match from "@/models/Match";
import Arena from "@/models/Arena";
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

        // 1. Identify Roles
        const admins = await User.find({ role: 'admin' }).select('_id').lean();
        const adminIds = new Set(admins.map(a => String(a._id)));
        const subadmins = await User.find({ role: 'subadmin' }).select('_id').lean();
        const subadminIds = new Set(subadmins.map(s => String(s._id)));

        // 2. Fetch all users for identity
        const allUsers = await User.find({}).select("name image email").lean();
        const userMap = new Map(allUsers.map(u => [String(u._id), u]));

        // 3. Get all active Match Stats as the skeleton
        const allStats = await UserMatchStats.find({})
            .populate({
                path: 'matchId',
                select: 'startTime teams venue status entryFee'
            })
            .sort({ 'matchId.startTime': -1 })
            .lean();

        if (!allStats.length) {
            return NextResponse.json({ weeks: [] });
        }

        // 4. Group by Week
        const weeks: Record<string, any> = {};

        for (const stat of allStats) {
            if (!stat.matchId) continue;
            const matchDate = new Date((stat.matchId as any).startTime);
            const { start, end, label } = getWeekBoundaries(matchDate);
            const weekKey = start.getTime().toString();

            if (!weeks[weekKey]) {
                weeks[weekKey] = {
                    key: weekKey,
                    label,
                    startDate: start,
                    endDate: end,
                    totalTurnover: 0,
                    totalAdminYield: 0,
                    subAdminRevenue: 0,
                    matchIds: new Set(),
                    userData: {} // userId -> { name, stats, matches }
                };
            }

            const week = weeks[weekKey];
            const mid = String((stat.matchId as any)._id);
            week.matchIds.add(mid);

            const userIdStr = String(stat.userId);
            const user = userMap.get(userIdStr);
            if (!user) continue;

            if (!week.userData[userIdStr]) {
                week.userData[userIdStr] = {
                    userId: userIdStr,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    stats: {
                        runs: 0,
                        balls: 0,
                        wins: 0,
                        losses: 0,
                        netWorth: 0,
                        turnover: 0
                    },
                    matches: []
                };
            }

            const uData = week.userData[userIdStr];
            uData.stats.runs += stat.totalRuns;
            uData.stats.balls += stat.totalBalls;

            uData.matches.push({
                matchId: mid,
                date: (stat.matchId as any).startTime,
                venue: (stat.matchId as any).venue,
                runs: stat.totalRuns,
                balls: stat.totalBalls,
                outcome: stat.totalRuns > 0 ? 'played' : 'did_not_bat'
            });
        }

        // 5. Enrich each week with ACTUAL Match and Transactional Data
        for (const weekKey in weeks) {
            const week = weeks[weekKey];
            
            // A. Fetch Match Details
            const matchesForWeek = await Match.find({ _id: { $in: Array.from(week.matchIds) } }).lean();
            const matchFinancialMap: Record<string, any> = {};

            for (const match of matchesForWeek) {
                const mid = String(match._id);
                // Fetch arenas for this match to get sub-admin splits
                const arenas = await Arena.find({ matchId: match._id }).lean();
                
                let matchTurnover = 0;
                let matchAdminTake = 0;
                let matchSubAdminCut = 0;

                arenas.forEach((a: any) => {
                    const pool = a.slotsCount * a.entryFee;
                    matchTurnover += pool;
                    matchAdminTake += pool * (a.adminCommissionPercentage / 100);
                    matchSubAdminCut += pool * (a.organizerCommissionPercentage / 100);
                });

                matchFinancialMap[mid] = {
                    id: mid,
                    name: `${match.teams?.[0]?.shortName} vs ${match.teams?.[1]?.shortName}`,
                    date: match.startTime,
                    venue: match.venue,
                    turnover: matchTurnover,
                    adminTake: matchAdminTake,
                    subAdminCut: matchSubAdminCut,
                    enrolled: arenas.reduce((acc, a) => acc + a.slotsCount, 0)
                };

                // Add to week totals
                week.totalTurnover += matchTurnover;
                week.totalAdminYield += matchAdminTake;
                week.subAdminRevenue += matchSubAdminCut;
            }

            week.matchReports = Object.values(matchFinancialMap).sort((a: any, b: any) => b.date.getTime() - a.date.getTime());

            // B. Individual Player Enrichment from Transactions
            const transactions = await Transaction.find({
                createdAt: { $gte: week.startDate, $lte: week.endDate },
                status: 'completed',
                type: { $in: ['winnings', 'bet_placed', 'refund'] }
            }).lean();

            transactions.forEach((tx: any) => {
                const txUserId = String(tx.userId);
                if (week.userData[txUserId]) {
                    const uData = week.userData[txUserId];
                    uData.stats.netWorth += tx.amount;
                    if (tx.type === 'bet_placed') {
                        uData.stats.turnover += Math.abs(tx.amount);
                    }
                }
            });

            // Update match outcome results
            Object.values(week.userData).forEach((u: any) => {
                const wins = u.matches.filter((m: any) => m.runs > 0).length;
                u.stats.wins = wins;
                u.stats.losses = Math.max(0, u.matches.length - wins);
            });
        }

        // Final formatting
        const formattedWeeks = Object.values(weeks)
            .sort((a: any, b: any) => b.startDate.getTime() - a.startDate.getTime())
            .map((w: any) => ({
                ...w,
                matchIds: undefined, // Cleanup
                users: Object.values(w.userData).map((u: any) => ({
                    ...u,
                    ledger: []
                })).sort((a, b) => b.stats.netWorth - a.stats.netWorth)
            }));

        return NextResponse.json({ weeks: formattedWeeks });

    } catch (error: any) {
        console.error("Admin Weekly Report API error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
