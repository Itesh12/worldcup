import connectDB from "./src/lib/db";
import Match from "./src/models/Match";
import UserMatchStats from "./src/models/UserMatchStats";
import UserBattingAssignment from "./src/models/UserBattingAssignment";

async function repair() {
    await connectDB();

    console.log("--- Starting Data Repair ---");

    // 1. Get all matches for mapping
    const matches = await Match.find({}).lean();

    // Heuristic: Find the match for "India vs South Africa"
    const indSouMatch = matches.find(m =>
        m.teams.some(t => t.name === "India") &&
        m.teams.some(t => t.name === "South Africa")
    );

    if (!indSouMatch) {
        console.error("Critical: Could not find current India vs South Africa match for re-linking.");
        process.exit(1);
    }

    console.log(`Current IND vs SOU Match ID: ${indSouMatch._id}`);

    // 2. Identify Orphans
    const matchIds = matches.map(m => m._id.toString());

    const allStats = await UserMatchStats.find({});
    const orphanedStats = allStats.filter(s => !matchIds.includes(s.matchId.toString()));

    const allSlots = await UserBattingAssignment.find({});
    const orphanedSlots = allSlots.filter(s => !matchIds.includes(s.matchId.toString()));

    console.log(`Orphaned Stats found: ${orphanedStats.length}`);
    console.log(`Orphaned Slots found: ${orphanedSlots.length}`);

    // 3. Repair Stats
    for (const stat of orphanedStats) {
        console.log(`Checking Stat duplication for Match ${indSouMatch._id}, User ${stat.userId}`);
        // Remove any existing empty/stale stats for this new match ID to avoid duplicate key error
        await UserMatchStats.deleteMany({ matchId: indSouMatch._id, userId: stat.userId });

        console.log(`Updating Stat ${stat._id}: Relinking to IND vs SOU (${indSouMatch._id})`);
        stat.matchId = indSouMatch._id;
        await stat.save();
    }

    // 4. Repair Slots
    for (const slot of orphanedSlots) {
        console.log(`Checking Slot duplication for Match ${indSouMatch._id}, Position ${slot.position}, User ${slot.userId}, Innings ${slot.inningsNumber}`);

        // Comprehensive cleanup: Remove any existing slots that conflict with either:
        // 1. (matchId, inningsNumber, position)
        // 2. (matchId, userId, inningsNumber)
        await UserBattingAssignment.deleteMany({
            $or: [
                { matchId: indSouMatch._id, inningsNumber: slot.inningsNumber, position: slot.position },
                { matchId: indSouMatch._id, userId: slot.userId, inningsNumber: slot.inningsNumber }
            ]
        });

        console.log(`Updating Slot ${slot._id}: Relinking to IND vs SOU (${indSouMatch._id})`);
        slot.matchId = indSouMatch._id;
        await slot.save();
    }

    console.log("\n--- Repair Complete ---");
    process.exit(0);
}

repair();
