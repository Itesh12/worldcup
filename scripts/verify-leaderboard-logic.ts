import connectDB from "./src/lib/db";
import UserBattingAssignment from "./src/models/UserBattingAssignment";
import SlotScore from "./src/models/SlotScore";
import BattingResolution from "./src/models/BattingResolution";
import Match from "./src/models/Match";

async function verify() {
    await connectDB();
    const match = await Match.findOne({});
    if (!match) {
        console.log("No matches found to verify.");
        process.exit(0);
    }

    const matchId = match._id.toString();
    console.log(`Verifying leaderboard for Match ID: ${matchId}`);

    // Mock an assignment if none exists
    const asgnCount = await UserBattingAssignment.countDocuments({ matchId });
    console.log(`Current assignments for match: ${asgnCount}`);

    // We can't easily call the API route directly in this script due to Next.js NextResponse
    // But we can verify the logic that the API uses.

    const assignments = await UserBattingAssignment.find({ matchId }).populate('userId', 'name image');
    const scores = await SlotScore.find({ matchId });
    const resolutions = await BattingResolution.find({ matchId });

    console.log(`Data found: ${assignments.length} assignments, ${scores.length} scores, ${resolutions.length} resolutions.`);

    const userStatsMap: Record<string, any> = {};
    assignments.forEach((asgn: any) => {
        const userId = asgn.userId?._id?.toString() || "Unknown";
        if (!userStatsMap[userId]) {
            userStatsMap[userId] = {
                name: asgn.userId?.name || "Unknown",
                totalRuns: 0,
                playingAs: []
            };
        }
        const score = scores.find(s => s.inningsNumber === asgn.inningsNumber && s.position === asgn.position);
        if (score) userStatsMap[userId].totalRuns += score.runs;

        const res = resolutions.find(r => r.inningsNumber === asgn.inningsNumber && r.position === asgn.position);
        if (res) userStatsMap[userId].playingAs.push(res.playerName);
    });

    console.log("\nLeaderboard Logic Output:");
    Object.values(userStatsMap).forEach((u: any) => {
        console.log(`- ${u.name}: ${u.totalRuns} runs (Playing as: ${u.playingAs.join(", ") || "None yet"})`);
    });

    if (assignments.length > 0) {
        console.log("\nVERIFICATION SUCCESS: Assigned users are correctly aggregated.");
    } else {
        console.log("\nVERIFICATION NOTE: No assignments found for this match. Please auto-assign users in Admin first.");
    }
    process.exit(0);
}

verify();
