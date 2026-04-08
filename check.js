const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected");

    // Check Arena
    const arena = await mongoose.connection.db.collection('arenas').findOne({ name: /OFFICIAL LEAGUE 1/ });
    console.log("Arena:", arena);

    if (arena) {
        // Check Match
        const match = await mongoose.connection.db.collection('matches').findOne({ _id: arena.matchId });
        console.log("Match Status:", match ? match.status : "Not found");

        // Check Assignments
        const assignments = await mongoose.connection.db.collection('userbattingassignments').find({ arenaId: arena._id }).toArray();
        console.log("Assignments Count:", assignments.length);
        console.log("Sample Assignment:", assignments[0]);

        // Check SlotScores
        const scoreCount = await mongoose.connection.db.collection('slotscores').countDocuments({ matchId: arena.matchId });
        console.log("SlotScores Count:", scoreCount);
    }

    await mongoose.disconnect();
}

run();
