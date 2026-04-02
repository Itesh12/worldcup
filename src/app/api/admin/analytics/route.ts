import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Match from "@/models/Match";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import UserMatchStats from "@/models/UserMatchStats";
import Transaction from "@/models/Transaction";
import SubAdminConfig from "@/models/SubAdminConfig";
import Arena from "@/models/Arena";
import Tournament from "@/models/Tournament";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // [1.1] Withdrawals Action
        const pendingWithdrawalsAgg = await Transaction.aggregate([
            { $match: { type: "withdrawal", status: "pending" } },
            { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$amount" } } }
        ]);
        const pendingWithdrawals = {
            count: pendingWithdrawalsAgg[0]?.count || 0,
            amount: pendingWithdrawalsAgg[0]?.amount || 0
        };

        // [1.2] Live/Upcoming Match Intelligence (30s Freshness)
        let liveMatches = await Match.find({ status: "live" })
            .select("teams startTime _id liveScore matchDesc seriesName status");
        
        const isStale = liveMatches.some(m => !m.liveScore?.lastUpdated || (now.getTime() - new Date(m.liveScore.lastUpdated).getTime()) > 30000);
        if (isStale) {
            const { syncLiveScores } = require("@/lib/scoreSync");
            syncLiveScores().catch(console.error);
        }

        // If no live matches, fetch today's upcoming matches
        if (liveMatches.length === 0) {
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            liveMatches = await Match.find({ 
                status: "upcoming",
                startTime: { $gte: now, $lte: endOfToday }
            })
            .sort({ startTime: 1 })
            .limit(3)
            .select("teams startTime _id liveScore matchDesc seriesName status");
        }

        // Deposits & Withdrawals today
        const todayDepositsAgg = await Transaction.aggregate([
            { $match: { type: "deposit", status: "completed", createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, amount: { $sum: "$amount" } } }
        ]);
        const todayWithdrawalsAgg = await Transaction.aggregate([
            { $match: { type: "withdrawal", status: "completed", createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, amount: { $sum: "$amount" } } }
        ]);

        const dailyFinancials = {
            deposits: todayDepositsAgg[0]?.amount || 0,
            withdrawals: Math.abs(todayWithdrawalsAgg[0]?.amount || 0)
        };

        // [2] Financial Liability & Ecosystem
        const liabilityAgg = await User.aggregate([
            { $match: { role: "user" } },
            { $group: { _id: null, totalBalance: { $sum: "$walletBalance" } } }
        ]);
        const totalSystemLiability = liabilityAgg[0]?.totalBalance || 0;

        const whales = await User.find({ role: "user" })
            .select("name email walletBalance image")
            .sort({ walletBalance: -1 })
            .limit(3);

        const highValueInteractions = await Transaction.find({
            status: "completed",
            amount: { $gte: 5000 },
            createdAt: { $gte: startOfToday }
        }).sort({ createdAt: -1 }).limit(3).populate("userId", "name");

        const topSubAdmins = await SubAdminConfig.find()
            .sort({ totalCommissionEarned: -1 })
            .limit(3)
            .populate("subAdminId", "name email");

        // [3] Global Fill Rate & Growth
        const activeMatches = await Match.find({ status: { $in: ["upcoming", "live"] } });
        const totalActiveSlots = activeMatches.reduce((acc, match) => acc + (match.maxSlots || 100), 0);
        let activeAssignments = 0;
        if (activeMatches.length > 0) {
            activeAssignments = await UserBattingAssignment.countDocuments({ 
                matchId: { $in: activeMatches.map(m => m._id) } 
            });
        }
        const globalFillRate = totalActiveSlots > 0 ? (activeAssignments / totalActiveSlots) * 100 : 0;

        const reg24h = await User.countDocuments({ createdAt: { $gte: oneDayAgo }, role: "user" });
        const reg7d = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, role: "user" });

        // [3.5] Today's Match Stats
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const todayMatches = await Match.find({
            startTime: { $gte: startOfToday, $lte: endOfToday }
        });
        
        let todayStats = {
            matchCount: todayMatches.length,
            arenaCount: 0,
            totalSlots: 0,
            filledSlots: 0
        };

        let missedOpportunities: any[] = [];

        if (todayMatches.length > 0) {
            const todayMatchIds = todayMatches.map(m => m._id);
            const todayArenas = await Arena.find({ matchId: { $in: todayMatchIds } });
            todayStats.arenaCount = todayArenas.length;
            todayStats.totalSlots = todayArenas.reduce((acc: number, a: any) => acc + a.maxSlots, 0);
            todayStats.filledSlots = todayArenas.reduce((acc: number, a: any) => acc + a.slotsCount, 0);

            // Find matches with NO arenas
            missedOpportunities = todayMatches.filter(m => 
                !todayArenas.some((a: any) => a.matchId.toString() === m._id.toString())
            ).map(m => ({
                _id: m._id,
                teams: m.teams,
                startTime: m.startTime
            }));
        }

        // [3.7] Active Tournaments & Intelligence (Phase 3)
        const activeTournaments = await Tournament.find({ isActive: true });
        const tournamentStats = await Promise.all(activeTournaments.map(async (t) => {
            const matchCount = await Match.countDocuments({ tournamentId: t._id });
            const userCount = await UserMatchStats.distinct("userId", { tournamentId: t._id });
            return {
                name: t.name,
                matchCount,
                userCount: userCount.length
            };
        }));

        const liquidityScore = totalSystemLiability > 0 ? (dailyFinancials.deposits / (totalSystemLiability / 30)) : 100; // Simplified Daily Coverage Index

        // [4] Live Audit Feed
        const latestTransactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("userId", "name");

        return NextResponse.json({
            actionDesk: {
                pendingWithdrawals,
                liveMatches,
                dailyFinancials,
                todayMatchStats: todayStats,
                missedOpportunities
            },
            financialRisk: {
                totalSystemLiability,
                whales,
                highValueInteractions,
                liquidityScore
            },
            ecosystem: {
                topSubAdmins,
                globalFillRate,
                totalUsers: await User.countDocuments(),
                growth: { reg24h, reg7d }
            },
            intelligence: {
                tournamentStats
            },
            auditFeed: latestTransactions
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
