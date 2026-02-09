import connectDB from "@/lib/db";
import Match from "@/models/Match";
import UserMatchStats from "@/models/UserMatchStats";

async function check() {
    await connectDB();
    console.log("Checking DB...");

    const matches = await Match.find({ status: { $in: ['finished', 'completed', 'result', 'settled'] } });
    console.log(`Found ${matches.length} finished matches.`);

    for (const m of matches) {
        console.log(`Match ${m._id}: ${m.teams[0].shortName} vs ${m.teams[1].shortName}`);
        const stats = await UserMatchStats.find({ matchId: m._id })
            .sort({ totalRuns: -1 })
            .limit(1)
            .populate('userId', 'name')
            .lean();

        console.log(`  - Top Scorer Found: ${stats.length}`);
        if (stats.length > 0) {
            console.log(JSON.stringify(stats[0], null, 2));
        }
    }
    process.exit(0);
}

check();
