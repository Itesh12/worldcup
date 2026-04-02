import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import SubAdminConfig from "@/models/SubAdminConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "subadmin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;
        await connectDB();

        // 1. Get Franchise Config
        const config = await SubAdminConfig.findOne({ subAdminId: userId });
        const commissionPercentage = config?.commissionPercentage || 5;

        // 2. Aggregate Arena History for Earnings
        const allArenas = await Arena.find({ createdBy: userId })
            .select("name entryFee slotsCount status createdAt")
            .sort({ createdAt: -1 });

        let totalRevenue = 0;
        let totalCommission = 0;
        let pendingCommission = 0;

        const transactions = allArenas.map(arena => {
            const revenue = arena.slotsCount * arena.entryFee;
            const commission = (revenue * commissionPercentage) / 100;
            
            totalRevenue += revenue;
            if (arena.status === 'closed' || arena.status === 'completed') {
                totalCommission += commission;
            } else {
                pendingCommission += commission;
            }

            return {
                _id: arena._id,
                name: arena.name,
                revenue,
                commission,
                status: arena.status,
                createdAt: arena.createdAt,
                fillRate: arena.slotsCount // Using this for simplicity in UI
            };
        });

        // 3. Time Series Data & Trend Calculation (Last 14 Days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Earnings from last 7 days
        const currentPeriodEarnings = await Arena.aggregate([
            { $match: { createdBy: userId, createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: null, total: { $sum: { $multiply: ["$slotsCount", "$entryFee"] } } } }
        ]);

        // Earnings from 7-14 days ago
        const previousPeriodEarnings = await Arena.aggregate([
            { $match: { createdBy: userId, createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
            { $group: { _id: null, total: { $sum: { $multiply: ["$slotsCount", "$entryFee"] } } } }
        ]);

        const currentRevenue = currentPeriodEarnings[0]?.total || 0;
        const previousRevenue = previousPeriodEarnings[0]?.total || 0;
        
        let trend = 0;
        if (previousRevenue > 0) {
            trend = ((currentRevenue - previousRevenue) / previousRevenue) * 100;
        } else if (currentRevenue > 0) {
            trend = 100; // First week growth
        }

        const dailyEarnings = await Arena.aggregate([
            {
                $match: {
                    createdBy: userId,
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailyRevenue: { $sum: { $multiply: ["$slotsCount", "$entryFee"] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Map to ensure all 7 days are present
        const velocity = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const dayData = dailyEarnings.find(d => d._id === dateKey);
            velocity.push({
                date: dateKey,
                amount: ((dayData?.dailyRevenue || 0) * commissionPercentage) / 100
            });
        }

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalCommission,
                pendingCommission,
                commissionRate: commissionPercentage,
                brandName: config?.brandName || "My Franchise",
                totalCommissionEarned: config?.totalCommissionEarned || 0,
                trend: Math.round(trend * 10) / 10
            },
            velocity,
            transactions
        });
    } catch (error: any) {
        console.error("Fetch Earnings Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
