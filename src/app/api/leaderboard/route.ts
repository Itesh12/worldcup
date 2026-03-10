import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('matchId');
        const tournamentId = searchParams.get('tournamentId');

        await connectDB();

        if (matchId) {
            const stats = await UserMatchStats.find({ matchId, tournamentId })
                .populate('userId', 'name email')
                .sort({ totalRuns: -1, totalBalls: 1 });
            return NextResponse.json(stats);
        } else {
            const limit = parseInt(searchParams.get('limit') || '50');
            const matchQuery = tournamentId 
                ? { tournamentId: new mongoose.Types.ObjectId(tournamentId) }
                : {};

            const globalStats = await UserMatchStats.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: "$userId",
                        totalRuns: { $sum: "$totalRuns" },
                        totalBalls: { $sum: "$totalBalls" }
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "userDetails"
                    }
                },
                { $unwind: "$userDetails" },
                {
                    $project: {
                        userId: {
                            _id: "$_id",
                            name: "$userDetails.name",
                            email: "$userDetails.email",
                            image: "$userDetails.image"
                        },
                        totalRuns: 1,
                        totalBalls: 1
                    }
                },
                { $sort: { totalRuns: -1, totalBalls: 1 } },
                { $limit: limit }
            ]);
            return NextResponse.json(globalStats);
        }
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
