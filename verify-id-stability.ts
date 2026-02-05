import connectDB from "./src/lib/db";
import Match from "./src/models/Match";
import { performMatchSync } from "./src/lib/matchSync";

async function verify() {
    await connectDB();
    console.log("--- BEFORE SYNC ---");
    const matchesBefore = await Match.find({});
    const beforeIds = matchesBefore.map(m => ({ id: m._id.toString(), ext: m.externalMatchId }));
    console.log("Matched IDs before:", beforeIds);

    console.log("\n--- TRIGGERING SYNC ---");
    await performMatchSync();

    console.log("\n--- AFTER SYNC ---");
    const matchesAfter = await Match.find({});
    const afterIds = matchesAfter.map(m => ({ id: m._id.toString(), ext: m.externalMatchId }));
    console.log("Matched IDs after:", afterIds);

    let allPreserved = true;
    for (const b of beforeIds) {
        const matchingAfter = afterIds.find(a => a.ext === b.ext);
        if (matchingAfter && matchingAfter.id !== b.id) {
            console.log(`FAIL: Match ${b.ext} ID changed from ${b.id} to ${matchingAfter.id}`);
            allPreserved = false;
        } else if (matchingAfter) {
            console.log(`SUCCESS: Match ${b.ext} ID preserved (${b.id})`);
        }
    }

    if (allPreserved) {
        console.log("\nVERIFICATION PASSED: IDs are stable across syncs.");
    } else {
        console.log("\nVERIFICATION FAILED: IDs were updated/churned.");
    }
    process.exit(0);
}

verify();
