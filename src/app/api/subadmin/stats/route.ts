import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Arena from "@/models/Arena";
import Match from "@/models/Match";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SubAdminConfig from "@/models/SubAdminConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!session || (user.role !== 'subadmin' && user.role !== 'admin')) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        const now = new Date();
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

        const config = await SubAdminConfig.findOne({ subAdminId: user.id });
        const commissionPercentage = config?.commissionPercentage || 5;
        const totalCommissionEarned = config?.totalCommissionEarned || 0;

        // Active Arenas
        const activeArenas = await Arena.find({ createdBy: user.id, status: "open" })
            .select("entryFee maxSlots slotsCount match");
        
        let pendingPayoutPipeline = 0;
        activeArenas.forEach(arena => {
            const filledAmount = arena.slotsCount * arena.entryFee;
            pendingPayoutPipeline += (filledAmount * (commissionPercentage / 100));
        });

        // "Needs Promotion" Alerts
        const openArenas = await Arena.find({ createdBy: user.id, status: "open" })
            .populate("matchId", "startTime");
        
        const needsPromotion = openArenas.filter(arena => {
            // Fill rate under 50%
            if (arena.slotsCount / arena.maxSlots >= 0.5) return false;
            // Starts in next 12 hours
            if (!arena.matchId || !arena.matchId.startTime) return false;
            const matchStartTime = new Date(arena.matchId.startTime);
            const hoursUntilStart = (matchStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
            return hoursUntilStart > 0 && hoursUntilStart <= 12;
        }).map(arena => ({
            _id: arena._id,
            name: arena.name,
            entryFee: arena.entryFee,
            fillRate: Math.round((arena.slotsCount / arena.maxSlots) * 100),
            hoursUntilStart: Math.round((new Date(arena.matchId.startTime).getTime() - now.getTime()) / (1000 * 60 * 60)),
        }));

        // Customer Intelligence (Player Network Size)
        const myArenasIds = await Arena.find({ createdBy: user.id }).distinct("_id");
        const uniquePlayers = await UserBattingAssignment.distinct("userId", { arena: { $in: myArenasIds } });
        const playerNetworkSize = uniquePlayers.length;

        // Find Best Entry Fee logic
        const arenasByEntry = await Arena.aggregate([
            { $match: { createdBy: user.id } },
            { $group: { 
                _id: "$entryFee", 
                avgFill: { $avg: { $divide: ["$slotsCount", "$maxSlots"] } },
                count: { $sum: 1 }
            }},
            { $sort: { avgFill: -1 } }
        ]);
        
        let bestEntryFee = arenasByEntry.length > 0 ? arenasByEntry[0]._id : 50;

        // Franchise Growth (New players assigned to this sub-admin)
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const newPlayers7d = await User.countDocuments({ 
            assignedSubAdminId: user.id, 
            createdAt: { $gte: sevenDaysAgo } 
        });

        // Network VIPs (Top 3 spenders/whales in their network)
        const networkVips = await User.find({ assignedSubAdminId: user.id })
            .select("name email walletBalance image")
            .sort({ walletBalance: -1 })
            .limit(3);

        // Find matches starting today with NO arena from this sub-admin
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const todayMatches = await Match.find({
            startTime: { $gte: startOfToday, $lte: endOfToday }
        });
        const myTodayArenaMatchIds = await Arena.find({ 
            createdBy: user.id, 
            matchId: { $in: todayMatches.map(m => m._id) } 
        }).distinct("matchId");
        
        const missedOpportunities = todayMatches.filter(m => 
            !myTodayArenaMatchIds.some(myId => myId.toString() === m._id.toString())
        ).map(m => ({
            _id: m._id,
            teams: m.teams,
            startTime: m.startTime
        }));

        let todayPerformance = {
            matchCount: todayMatches.length,
            arenaCount: 0,
            totalSlots: 0,
            filledSlots: 0,
            projectedCommission: 0
        };

        if (todayMatches.length > 0) {
            const todayMatchIds = todayMatches.map(m => m._id);
            const myTodayArenas = await Arena.find({ 
                createdBy: user.id, 
                matchId: { $in: todayMatchIds } 
            });
            todayPerformance.arenaCount = myTodayArenas.length;
            todayPerformance.totalSlots = myTodayArenas.reduce((acc: number, a: any) => acc + a.maxSlots, 0);
            todayPerformance.filledSlots = myTodayArenas.reduce((acc: number, a: any) => acc + a.slotsCount, 0);
            myTodayArenas.forEach(arena => {
                const filledAmount = arena.slotsCount * arena.entryFee;
                todayPerformance.projectedCommission += (filledAmount * (commissionPercentage / 100));
            });
        }

        const recentArenas = await Arena.find({ createdBy: user.id })
            .select('name entryFee slotsCount maxSlots status createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        return NextResponse.json({
            liveMatches,
            gamification: {
                brandName: config?.brandName || "My Franchise",
                commissionPercentage,
                totalCommissionEarned,
                currentTier: totalCommissionEarned >= 20000 ? "Diamond" : 
                            totalCommissionEarned >= 5000 ? "Gold" : 
                            totalCommissionEarned >= 1000 ? "Silver" : "Bronze",
                nextTierThreshold: totalCommissionEarned >= 20000 ? null : 
                                   totalCommissionEarned >= 5000 ? 20000 : 
                                   totalCommissionEarned >= 1000 ? 5000 : 1000,
            },
            alerts: {
                needsPromotion,
                missedOpportunities // New field
            },
            intelligence: {
                playerNetworkSize,
                newPlayers7d, // New field
                networkVips, // New field
                pendingPayoutPipeline,
                bestEntryFee,
                todayPerformance 
            },
            recentArenas
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
