import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userIdStr = (session.user as any).id;
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

            // Format match history for the frontend
            const matchHistory = detailedStats.map((stat: any) => ({
                matchId: stat.matchId._id,
                date: stat.matchId.startTime,
                opponent: "TBD", // Simplification: client or deeper logic can figure out opponent based on user's team
                teams: stat.matchId.teams,
                venue: stat.matchId.venue,
                runs: stat.totalRuns,
                balls: stat.totalBalls,
                strikeRate: stat.totalBalls > 0 ? ((stat.totalRuns / stat.totalBalls) * 100).toFixed(1) : "0.0",
                outcome: stat.matchId.status
            }));

            // Find highest score
            const highestScore = detailedStats.reduce((max, curr) => (curr.totalRuns > max ? curr.totalRuns : max), 0);


            return NextResponse.json({
                overview: {
                    matches: matchesPlayed,
                    runs: totalRuns,
                    balls: totalBalls,
                    average,
                    strikeRate,
                    highestScore
                },
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
