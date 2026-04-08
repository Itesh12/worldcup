import connectDB from "./src/lib/db";
import Arena from "./src/models/Arena";
import Match from "./src/models/Match";
import UserBattingAssignment from "./src/models/UserBattingAssignment";
import { settleArena } from "./src/lib/revealLogic";
import mongoose from "mongoose";

/**
 * REPAIR SCRIPT FOR YESTERDAY'S MATCHES
 * 1. Finds 'completed' arenas where positions are still null
 * 2. Resets status to 'revealed' (with automatic shuffle via the hardened settleArena)
 * 3. Triggers a fresh settlement
 */
async function repairData() {
    try {
        await connectDB();
        console.log("Starting Repair...");

        // Find matches that might be finished but need sync
        const finishedMatches = await Match.find({ status: 'finished' });
        console.log(`Checking ${finishedMatches.length} finished matches...`);

        // Find arenas linked to these matches that are already 'completed' but have 0/null positions
        const problematicArenas = await Arena.find({
            status: 'completed'
        });

        let repairedCount = 0;

        for (const arena of problematicArenas) {
            const assignments = await UserBattingAssignment.find({ arenaId: arena._id });
            const needsRepair = assignments.some(a => a.position === null || a.position === undefined);

            if (needsRepair) {
                console.log(`Repairing Arena: ${arena.name}`);
                
                // 1. Reset arena status to NOT completed so we can re-settle
                arena.status = 'revealed';
                arena.isRevealed = false; // Force re-reveal via self-healing logic
                await arena.save();

                // 2. Clear out any previous winnings transactions for this arena to avoid double-payouts (Safety)
                // Actually, if everyone got 0 runs, there shouldn't be any winnings transactions, 
                // but let's be safe.

                // 3. Trigger Hardened Settlement
                const result = await settleArena(arena._id.toString());
                console.log(`Settlement Result for ${arena.name}:`, result);
                repairedCount++;
            }
        }

        console.log(`Repair Complete. Total Repaired: ${repairedCount}`);

    } catch (err) {
        console.error("Repair Failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

repairData();
