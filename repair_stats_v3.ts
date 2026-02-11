
import * as dotenv from 'dotenv';
import path from 'path';

// Load env before ANY other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from "mongoose";
import connectDB from "./src/lib/db";
import Match from "./src/models/Match";
import SlotScore from "./src/models/SlotScore";
import UserMatchStats from "./src/models/UserMatchStats";

async function repair() {
    console.log("Starting Repair Process V3 (Cleanup Upcoming Matches)...");
    await connectDB();

    const upcomingMatches = await Match.find({ status: { $in: ['upcoming', 'abandoned'] } }).select('_id status');
    console.log(`Found ${upcomingMatches.length} upcoming/abandoned matches to clean.`);

    const matchIds = upcomingMatches.map(m => m._id);

    // 1. Delete UserMatchStats for these matches
    const statsResult = await UserMatchStats.deleteMany({ matchId: { $in: matchIds } });
    console.log(`Deleted ${statsResult.deletedCount} UserMatchStats entries for upcoming matches.`);

    // 2. Delete SlotScore for these matches (only the 0-run ones we likely created? Or all?)
    // Safe to delete ALL slot scores for strictly upcoming matches as they shouldn't have scores yet.
    const scoreResult = await SlotScore.deleteMany({ matchId: { $in: matchIds } });
    console.log(`Deleted ${scoreResult.deletedCount} SlotScore entries for upcoming matches.`);

    console.log("Cleanup Complete.");
    process.exit(0);
}

repair();
