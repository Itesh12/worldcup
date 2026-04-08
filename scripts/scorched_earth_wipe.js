const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function scorchedEarth() {
    try {
        console.log("🔥 ABSOLUTE SCORCHED EARTH WIPE INITIATED 🔥");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB cluster...");

        const collections = [
            'matches',
            'battingslots',
            'battingresolutions',
            'slotscores',
            'usermatchstats',
            'userbattingassignments',
            'arenas',
            'tournaments',
            'transactions',
            'subadminconfigs',
            'systemlogs',
            'notifications',
            'users' // TOTAL WIPE
        ];

        for (const col of collections) {
            console.log(`Clearing collection: ${col}...`);
            await mongoose.connection.db.collection(col).deleteMany({});
        }

        console.log("✅ SYSTEM RESET COMPLETE. 0 DATA REMAINING.");
        console.log("YOU MUST NOW RE-REGISTER AN ACCOUNT.");
    } catch (err) {
        console.error("FAILED TO WIPE:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

scorchedEarth();
