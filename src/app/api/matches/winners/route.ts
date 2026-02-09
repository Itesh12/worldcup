import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";
import UserMatchStats from "@/models/UserMatchStats";
import User from "@/models/User"; // Ensure User model is registered

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "5");

        // 1. Find recent finished matches
        let query = Match.find({
            status: { $in: ['finished', 'completed', 'result', 'settled'] }
        }).sort({ startTime: -1 });

        if (limit > 0) {
            query = query.limit(limit);
        }

        const recentMatches = await query;

        const winnersData = [];

        // 2. For each match, find the winner (Max runs, then min balls)
        for (const match of recentMatches) {
            const winnerStats = await UserMatchStats.findOne({
                matchId: match._id,
            })
                .sort({ totalRuns: -1, totalBalls: 1 }) // Highest runs, then fewest balls
                .populate('userId', 'name image')
                .lean() as any;

            if (winnerStats && winnerStats.userId) {
                winnersData.push({
                    match: {
                        _id: match._id,
                        teams: match.teams,
                        date: match.startTime,
                        venue: match.venue
                    },
                    winner: {
                        userId: winnerStats.userId._id,
                        name: winnerStats.userId.name,
                        image: winnerStats.userId.image,
                        score: winnerStats.totalRuns,
                        balls: winnerStats.totalBalls,
                        strikeRate: winnerStats.totalBalls > 0 ? ((winnerStats.totalRuns / winnerStats.totalBalls) * 100).toFixed(1) : "0.0"
                    }
                });
            }
        }

        return NextResponse.json(winnersData);

    } catch (error: any) {
        console.error("Error fetching match winners:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
