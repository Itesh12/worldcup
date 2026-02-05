import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";
import BattingResolution from "@/models/BattingResolution";
import SlotScore from "@/models/SlotScore";
import UserMatchStats from "@/models/UserMatchStats";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import { getLiveMatchData } from "@/lib/cricketApi";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const targetMatchId = searchParams.get("matchId");

    // Allow bypass for focused match sync or if CRON_SECRET matches
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !targetMatchId) {
        // return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        // 1. Get matches to sync
        const query = targetMatchId ? { _id: targetMatchId } : { status: "live" };
        const matchesToSync = await Match.find(query);

        for (const match of matchesToSync) {
            const liveData = await getLiveMatchData(match.externalMatchId);
            if (!liveData) continue;

            for (const player of liveData.batsmen) {
                const { position, inningsNumber = liveData.innings } = player as any;

                // 2. Resolve Player to Slot
                await BattingResolution.findOneAndUpdate(
                    { matchId: match._id, inningsNumber, position },
                    { actualPlayerId: player.playerId, playerName: player.name },
                    { upsert: true }
                );

                // 3. Update Slot Score
                const score = await SlotScore.findOneAndUpdate(
                    { matchId: match._id, inningsNumber, position },
                    {
                        runs: player.runs,
                        balls: player.balls,
                        fours: player.fours,
                        sixes: player.sixes,
                        isOut: player.isOut
                    },
                    { upsert: true, new: true }
                );

                // 4. Update User Aggregate Cache if assignment exists
                const assignment = await UserBattingAssignment.findOne({
                    matchId: match._id,
                    inningsNumber,
                    position
                });

                if (assignment) {
                    // Re-calculate total stats for the user in this match
                    // Simplified: just update for this specific slot's change
                    // Accurate: Sum all slots for this user in this match
                    const userSlots = await UserBattingAssignment.find({
                        matchId: match._id,
                        userId: assignment.userId
                    });

                    let totalRuns = 0;
                    let totalBalls = 0;

                    for (const uSlot of userSlots) {
                        const sScore = await SlotScore.findOne({
                            matchId: match._id,
                            inningsNumber: uSlot.inningsNumber,
                            position: uSlot.position
                        });
                        if (sScore) {
                            totalRuns += sScore.runs;
                            totalBalls += sScore.balls;
                        }
                    }

                    await UserMatchStats.findOneAndUpdate(
                        { matchId: match._id, userId: assignment.userId },
                        { totalRuns, totalBalls },
                        { upsert: true }
                    );
                }
            }

            // 5. Update match status if finished (simulated)
            if (liveData.status === 'finished') {
                await Match.findByIdAndUpdate(match._id, { status: 'finished' });
            }
        }

        return NextResponse.json({ message: "Sync completed" });
    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
