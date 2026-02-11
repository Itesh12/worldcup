
import * as dotenv from 'dotenv';
import path from 'path';

// Load env before ANY other imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import connectDB from './src/lib/db';
import Match from './src/models/Match';
import UserMatchStats from './src/models/UserMatchStats';

(async () => {
    await connectDB();

    // 1. Count Matches by Status
    const matches = await Match.find({});
    const counts = matches.reduce((acc: any, m: any) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
    }, {});
    console.log('Match Status Counts:', counts);

    // 2. Check for UserMatchStats linked to Upcoming matches
    const upcomingMatches = matches.filter((m: any) => m.status === 'upcoming' || m.status === 'abandoned').map((m: any) => m._id);
    const invalidStats = await UserMatchStats.countDocuments({ matchId: { $in: upcomingMatches } });

    console.log(`UserStats for Upcoming/Abandoned matches: ${invalidStats}`);

    // Detail breakdown if invalid stats exist
    if (invalidStats > 0) {
        const sample = await UserMatchStats.findOne({ matchId: { $in: upcomingMatches } }).populate('matchId');
        if (sample) {
            console.log('Sample Invalid Stat:', {
                user: sample.userId,
                matchId: sample.matchId._id,
                matchStatus: (sample.matchId as any).status,
                runs: sample.totalRuns
            });
        }
    }

    process.exit(0);
})();
