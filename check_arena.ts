import connectDB from "./src/lib/db";
import Arena from "./src/models/Arena";
import Match from "./src/models/Match";
import UserBattingAssignment from "./src/models/UserBattingAssignment";
import SlotScore from "./src/models/SlotScore";
import mongoose from "mongoose";

async function checkArena() {
    try {
        await connectDB();
        console.log("Checking Arena...");
        
        const arena = await Arena.findOne({ name: /OFFICIAL LEAGUE 1/ }).populate('matchId');
        if (!arena) {
            console.log("Arena not found");
            return;
        }

        console.log("Arena Details:", {
            id: arena._id,
            name: arena.name,
            status: arena.status,
            isRevealed: arena.isRevealed,
            matchStatus: (arena.matchId as any)?.status,
            matchName: (arena.matchId as any)?.name,
            externalMatchId: (arena.matchId as any)?.externalMatchId
        });

        const assignments = await UserBattingAssignment.find({ arenaId: arena._id });
        console.log(`Found ${assignments.length} assignments:`);
        assignments.forEach(a => {
            console.log(`- User: ${a.userId}, Innings: ${a.inningsNumber}, Pos: ${a.position}`);
        });

        const scores = await SlotScore.find({ matchId: arena.matchId });
        console.log(`Found ${scores.length} score entries for this match.`);
        if (scores.length > 0) {
            console.log("Sample Score:", scores[0]);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

checkArena();
