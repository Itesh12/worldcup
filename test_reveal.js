const { revealArenaPositions } = require('./src/lib/revealLogic');
const mongoose = require('mongoose');

async function test() {
    const MONGODB_URI = 'mongodb+srv://Kruti98:Kruti98.@cluster0.lkh2x.mongodb.net/worldcup?retryWrites=true&w=majority';
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB for Testing...");

    const Arena = require('./src/models/Arena');
    // Find an arena that needs revealing
    const arena = await Arena.default.findOne({ status: 'open' });
    if (!arena) {
        console.log("No open arenas found.");
        process.exit(0);
    }
    console.log(`Revealing arena: ${arena._id}`);
    try {
        const result = await revealArenaPositions(arena._id.toString());
        console.log("Result:", result);
    } catch(e) {
        console.error("Reveal Error:", e);
    }
    process.exit(0);
}
test().catch(console.error);
