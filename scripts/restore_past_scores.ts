import connectDB from "../src/lib/db";
import Match from "../src/models/Match";
import { getLiveMatchData } from "../src/lib/cricketApi";
import BattingResolution from "../src/models/BattingResolution";
import SlotScore from "../src/models/SlotScore";
import UserBattingAssignment from "../src/models/UserBattingAssignment";
import UserMatchStats from "../src/models/UserMatchStats";
import { logSystemEvent } from "../src/lib/systemLogger";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function restore(matchId: string) {
    try {
        await connectDB();
        console.log(`Restoring Match: ${matchId}`);

        const match = await Match.findById(matchId);
        if(!match) {
            console.error("Match not found");
            return;
        }

        console.log(`Target: ${match.teams[0].name} vs ${match.teams[1].name}`);
        const liveData = await getLiveMatchData(match.externalMatchId);

        if(!liveData) {
            console.error("No live data found for this match ID. Check if externalMatchId is correct.");
            return;
        }

        console.log(`Scorecard Found. status: ${liveData.status}. batsmen: ${liveData.batsmen.length}`);

        for (const player of liveData.batsmen) {
            const { position, inningsNumber = liveData.innings } = player as any;
            
            console.log(`Syncing Pos ${position}: ${player.name} (${player.runs} runs)`);

            await BattingResolution.findOneAndUpdate(
                { matchId: match._id, inningsNumber, position },
                { actualPlayerId: player.playerId, playerName: player.name },
                { upsert: true }
            );

            await SlotScore.findOneAndUpdate(
                { matchId: match._id, inningsNumber, position },
                {
                    runs: player.runs,
                    balls: player.balls,
                    fours: player.fours,
                    sixes: player.sixes,
                    isOut: player.isOut
                },
                { upsert: true }
            );

            // Update user stats
            const assignments = await UserBattingAssignment.find({ matchId: match._id, inningsNumber, position });
            for (const asgn of assignments) {
                const userSlots = await UserBattingAssignment.find({ matchId: match._id, userId: asgn.userId });
                let totalRuns = 0;
                let totalBalls = 0;
                for (const uSlot of userSlots) {
                    const sScore = await SlotScore.findOne({ matchId: match._id, inningsNumber: uSlot.inningsNumber, position: uSlot.position });
                    if(sScore) {
                        totalRuns += sScore.runs;
                        totalBalls += sScore.balls;
                    }
                }
                await UserMatchStats.findOneAndUpdate(
                    { matchId: match._id, userId: asgn.userId },
                    { totalRuns, totalBalls },
                    { upsert: true }
                );
            }
        }

        await logSystemEvent('sync', 'success', `Manual Restoration: Corrected scores for ${match.teams[0].name} vs ${match.teams[1].name}`, matchId);
        console.log("Restoration Complete!");

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

const matchId = process.argv[2] || '69d4d8fddf40591b4a20996b';
restore(matchId);
