import connectDB from "./src/lib/db";
import Match from "./src/models/Match";
import UserMatchStats from "./src/models/UserMatchStats";
import UserBattingAssignment from "./src/models/UserBattingAssignment";

async function diagnose() {
    await connectDB();

    console.log("--- Collection Counts ---");
    const matchCount = await Match.countDocuments();
    const statsCount = await UserMatchStats.countDocuments();
    const slotCount = await UserBattingAssignment.countDocuments();
    console.log(`Matches: ${matchCount}`);
    console.log(`Stats: ${statsCount}`);
    console.log(`Slots: ${slotCount}`);

    console.log("\n--- Checking for Orphaned Data ---");

    const allMatches = await Match.find({}, '_id externalMatchId teams').lean();
    const matchIds = allMatches.map(m => m._id.toString());

    const allStats = await UserMatchStats.find({}).lean();
    const orphanedStats = allStats.filter(s => !matchIds.includes(s.matchId.toString()));

    const allSlots = await UserBattingAssignment.find({}).lean();
    const orphanedSlots = allSlots.filter(s => !matchIds.includes(s.matchId.toString()));

    console.log(`Orphaned Stats: ${orphanedStats.length}`);
    console.log(`Orphaned Slots: ${orphanedSlots.length}`);

    if (orphanedStats.length > 0) {
        console.log("\nExample Orphaned Stats (MatchID):");
        orphanedStats.slice(0, 3).forEach(s => console.log(`- MatchID: ${s.matchId}, Runs: ${s.totalRuns}`));
    }

    if (orphanedSlots.length > 0) {
        console.log("\nExample Orphaned Slots (MatchID):");
        orphanedSlots.slice(0, 3).forEach(s => console.log(`- MatchID: ${s.matchId}, Position: ${s.position}`));
    }

    process.exit(0);
}

diagnose();
