import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = (session.user as any).id;

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

        return NextResponse.json({
            totalRuns: userStats.totalRuns,
            totalBalls: userStats.totalBalls,
            rank: rank
        });

    } catch (error: any) {
        console.error("User Stats API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
