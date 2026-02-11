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

            // Track which positions were updated by live data
            const updatedPositions = new Set<number>();

            for (const player of liveData.batsmen) {
                const { position, inningsNumber = liveData.innings } = player as any;
                updatedPositions.add(position);

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

            // --- Handle "Did Not Bat" Players ---
            // Fetch all assignments for this match/innings that were NOT updated above
            // We need to check both innings if liveData contains both, or just current.
            // But simple approach: check assignments for the innings we just processed.
            // Since liveData.batsmen might contain multiple innings, we should group by innings.

            // Allow checking for players who were assigned but missed the database update above
            // We iterate all assignments for this match. If their position/innings wasn't in updatedPositions (per innings),
            // we assume they played but got 0 runs (did not bat).
            // NOTE: We need to know which innings assignments belong to.

            // --- Handle "Did Not Bat" Players ---
            // Fetch all assignments for this match/innings that were NOT updated above
            // IMPORTANT: Only do this for Live or Finished matches. Upcoming matches should NOT have stats.

            if (match.status !== 'upcoming') {
                // Optimized approach: Iterating all assignments for the match
                const allAssignments = await UserBattingAssignment.find({ matchId: match._id });

                for (const assignment of allAssignments) {
                    // Check if this player/innings/pos was in `liveData.batsmen`.
                    const wasActive = liveData.batsmen.find((b: any) =>
                        b.position === assignment.position &&
                        (b.inningsNumber || liveData.innings) === assignment.inningsNumber
                    );

                    if (!wasActive) {
                        // This player did not bat (yet, or at all).
                        // We mark them as 0 runs, 0 balls.
                        // IMPORTANT: Only if the innings is "completed" or simply to ensure they appear in stats?
                        // The user wants them to appear as "played". So we force a 0 score.

                        await SlotScore.findOneAndUpdate(
                            { matchId: match._id, inningsNumber: assignment.inningsNumber, position: assignment.position },
                            {
                                $setOnInsert: { // Only set these if creating fresh
                                    runs: 0,
                                    balls: 0,
                                    fours: 0,
                                    sixes: 0,
                                    isOut: false
                                }
                            },
                            { upsert: true, new: true }
                        );

                        // We must also update UserMatchStats for them, ensuring they have an entry
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
                            { totalRuns, totalBalls }, // This will be 0 if all slots are 0
                            { upsert: true }
                        );
                    }
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
