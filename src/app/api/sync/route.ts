import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";
import BattingResolution from "@/models/BattingResolution";
import SlotScore from "@/models/SlotScore";
import UserMatchStats from "@/models/UserMatchStats";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import Tournament from "@/models/Tournament";
import { getLiveMatchData } from "@/lib/cricketApi";
import { notifyAdmins, notifyUsersInMatch } from "@/lib/notificationLogic";
import { logSystemEvent } from "@/lib/systemLogger";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const targetMatchId = searchParams.get("matchId");

    // Allow bypass for focused match sync or if CRON_SECRET matches
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !targetMatchId) {
        // return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const statusUpdates: { matchId: string, updated: boolean }[] = [];

    try {
        await connectDB();

        // 1. Get matches to sync:
        // - Specific match if targetMatchId provided
        // - ALL Live matches
        // - Upcoming matches that should have started by now
        // - FINISHED matches that still have unsettled arenas (Critical for restoring past data)
        const now = new Date();
        
        let query: any;
        if (targetMatchId) {
            query = { _id: targetMatchId };
        } else {
            // Find Match IDs that have open arenas
            const Arena = (await import("@/models/Arena")).default;
            const openArenas = await Arena.find({ status: { $ne: 'completed' } }).select('matchId');
            const openMatchIds = [...new Set(openArenas.map(a => a.matchId))];

            query = { 
                $or: [
                    { status: "live" },
                    { status: "upcoming", startTime: { $lte: now } },
                    { _id: { $in: openMatchIds }, status: "finished" }
                ]
            };
        }
            
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

            // 5. Update match status
            if (liveData.status === 'finished') {
                // Fetch tournament for commission info
                const tournament = await Tournament.findById(match.tournamentId).lean() as any;
                let adminCommissionEarned = 0;

                if (tournament) {
                    const numParticipants = await UserBattingAssignment.countDocuments({ matchId: match._id });
                    const currentEntryFee = match.entryFee || tournament.entryFee || 50;
                    const currentCommissionPct = match.commissionPercentage ?? tournament.commissionPercentage ?? 0;
                    
                    const totalPool = numParticipants * currentEntryFee;
                    adminCommissionEarned = totalPool * (currentCommissionPct / 100);
                }

                await Match.findByIdAndUpdate(match._id, { 
                    status: 'finished',
                    adminCommissionEarned
                });
                statusUpdates.push({ matchId: match._id.toString(), updated: true });

                await notifyAdmins({
                    title: "Match Finished",
                    message: `Match ${match.teams[0].shortName} vs ${match.teams[1].shortName} has concluded. Settlement will be processed in 20 mins.`,
                    type: 'match'
                });

                // User Notification for Match Finish
                await notifyUsersInMatch(match._id.toString(), {
                    title: "Match Concluded! 🏁",
                    message: `${match.teams[0].shortName} vs ${match.teams[1].shortName} is over. Settlement starting soon.`,
                    type: 'match',
                    link: `/matches/${match._id}`
                });

            } else if (match.status === 'upcoming') {
                // Moving from upcoming to live
                await Match.findByIdAndUpdate(match._id, { status: 'live' });
                statusUpdates.push({ matchId: match._id.toString(), updated: true });
                
                await notifyAdmins({
                    title: "Match Live Now! 🏏",
                    message: `${match.teams[0].shortName} vs ${match.teams[1].shortName} is now LIVE. Scores are being synced.`,
                    type: 'match'
                });

                // User Notification for Match Live
                await notifyUsersInMatch(match._id.toString(), {
                    title: "Match Live Now! 🏏",
                    message: `${match.teams[0].shortName} vs ${match.teams[1].shortName} has started. Good luck!`,
                    type: 'match',
                    link: `/matches/${match._id}`
                });
            } else {
                statusUpdates.push({ matchId: match._id.toString(), updated: false });
            }
        }

        const updatedCount = statusUpdates.filter(u => u.updated).length;
        if (updatedCount > 0) {
            await logSystemEvent('sync', 'success', `Synced ${matchesToSync.length} matches. ${updatedCount} status transitions performed.`);
        } else {
            await logSystemEvent('sync', 'success', `Heartbeat: Sync completed for ${matchesToSync.length} matches.`);
        }

        return NextResponse.json({ message: "Sync completed" });
    } catch (error: any) {
        console.error("Sync Error:", error);
        await logSystemEvent('sync', 'error', `Sync failed: ${error.message}`);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
