import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');

        await connectDB();

        // Aggregate from Transactions: Type 'winnings', Status 'completed'
        const globalStats = await Transaction.aggregate([
            { $match: { type: { $in: ['winnings', 'bet_placed'] }, status: 'completed' } },
            {
                $group: {
                    _id: "$userId",
                    netProfit: { $sum: "$amount" },
                    totalWon: { $sum: { $cond: [{ $eq: ["$type", "winnings"] }, "$amount", 0] } },
                    winCount: { $sum: { $cond: [{ $eq: ["$type", "winnings"] }, 1, 0] } }
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
                    netProfit: 1,
                    totalWon: 1,
                    winCount: 1
                }
            },
            { $sort: { netProfit: -1, winCount: -1 } },
            { $limit: limit }
        ]);

        return NextResponse.json(globalStats);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
