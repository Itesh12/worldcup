import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Match from "@/models/Match";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import UserMatchStats from "@/models/UserMatchStats";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // [1] User Stats
        const totalUsers = await User.countDocuments();
        const bannedUsers = await User.countDocuments({ isBanned: true });
        const adminUsers = await User.countDocuments({ role: "admin" });
        const activeUsers = totalUsers - bannedUsers;

        // [2] Match Stats
        const totalMatches = await Match.countDocuments();
        const liveMatches = await Match.countDocuments({ status: "live" });
        const upcomingMatches = await Match.countDocuments({ status: "upcoming" });
        const finishedMatches = await Match.countDocuments({ status: { $in: ["finished", "completed"] } });

        // [3] Engagement Stats (Slots)
        const totalAssignments = await UserBattingAssignment.countDocuments();

        // Find upcoming match IDs to check active bookings
        const upcomingMatchIds = await Match.find({ status: "upcoming" }).distinct("_id");
        const activeAssignments = await UserBattingAssignment.countDocuments({ matchId: { $in: upcomingMatchIds } });

        // [4] Performance Stats (Runs & Leaderboard)
        // Global Runs
        const runsAgg = await UserMatchStats.aggregate([
            { $group: { _id: null, total: { $sum: "$totalRuns" } } }
        ]);
        const totalRuns = runsAgg[0]?.total || 0;

        // Top 3 Players
        const topPlayers = await UserMatchStats.aggregate([
            { $group: { _id: "$userId", totalRuns: { $sum: "$totalRuns" } } },
            { $sort: { totalRuns: -1 } },
            { $limit: 3 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    name: "$user.name",
                    image: "$user.image",
                    totalRuns: 1
                }
            }
        ]);

        return NextResponse.json({
            users: {
                total: totalUsers,
                active: activeUsers,
                banned: bannedUsers,
                admins: adminUsers
            },
            matches: {
                total: totalMatches,
                live: liveMatches,
                upcoming: upcomingMatches,
                finished: finishedMatches
            },
            engagement: {
                totalAssignments,
                activeAssignments
            },
            performance: {
                totalRuns,
                topPlayers
            }
        });

    } catch (error) {
        console.error("Analytics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
