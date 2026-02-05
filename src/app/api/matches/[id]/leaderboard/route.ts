import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import User from "@/models/User";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SlotScore from "@/models/SlotScore";
import BattingResolution from "@/models/BattingResolution";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: matchId } = await params;

        await connectDB();

        // 1. Fetch all assignments for this match
        const assignments = await UserBattingAssignment.find({ matchId }).populate('userId', 'name image');

        // 2. Fetch all scores for this match
        const scores = await SlotScore.find({ matchId });

        // 3. Fetch all resolutions (player names) for this match
        const resolutions = await BattingResolution.find({ matchId });

        // 4. Aggregate data by user
        const userStatsMap: Record<string, any> = {};

        assignments.forEach((asgn: any) => {
            const userId = asgn.userId._id.toString();
            if (!userStatsMap[userId]) {
                userStatsMap[userId] = {
                    user: asgn.userId,
                    totalRuns: 0,
                    totalBalls: 0,
                    totalFours: 0,
                    totalSixes: 0,
                    playingAs: []
                };
            }

            // Find score for this specific assignment (innings + position)
            const score = scores.find(s => s.inningsNumber === asgn.inningsNumber && s.position === asgn.position);
            if (score) {
                userStatsMap[userId].totalRuns += score.runs;
                userStatsMap[userId].totalBalls += score.balls;
                userStatsMap[userId].totalFours += (score.fours || 0);
                userStatsMap[userId].totalSixes += (score.sixes || 0);
            }

            // Find resolution (cricketer name) for this specific assignment
            const res = resolutions.find(r => r.inningsNumber === asgn.inningsNumber && r.position === asgn.position);
            if (res) {
                userStatsMap[userId].playingAs.push(res.playerName);
            } else {
                // Fallback indicator if cricketer isn't resolved yet
                userStatsMap[userId].playingAs.push(`Slot ${asgn.position} (Innings ${asgn.inningsNumber})`);
            }
        });

        // 5. Convert to array and sort
        const leaderboard = Object.values(userStatsMap)
            .sort((a: any, b: any) => {
                if (b.totalRuns !== a.totalRuns) return b.totalRuns - a.totalRuns;
                return a.totalBalls - b.totalBalls; // Fewer balls = better rank
            })
            .map((entry: any, index: number) => ({
                rank: index + 1,
                user: entry.user,
                totalRuns: entry.totalRuns,
                totalBalls: entry.totalBalls,
                totalFours: entry.totalFours,
                totalSixes: entry.totalSixes,
                strikeRate: entry.totalBalls > 0 ? (entry.totalRuns / entry.totalBalls * 100).toFixed(1) : "0.0",
                playingAs: entry.playingAs
            }));

        return NextResponse.json(leaderboard);
    } catch (error: any) {
        console.error("Match Leaderboard Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
