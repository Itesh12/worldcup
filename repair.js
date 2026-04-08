const mongoose = require('mongoose');
require('dotenv').config();

// Define a minimal settle logic in JS since we can't easily import the complex TS one here 
// but we CAN trigger the repair by just changing the status back to 'revealed' and isRevealed: false
// and then the NEXT run of the settlement cron will fix it automatically thanks to our hardening!

async function repair() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB for Repair");

        const arenas = await mongoose.connection.db.collection('arenas').find({ status: 'completed' }).toArray();
        console.log(`Checking ${arenas.length} completed arenas...`);

        let count = 0;
        for (const arena of arenas) {
            // Check if it has the TBA issue (position: null)
            const assignments = await mongoose.connection.db.collection('userbattingassignments').find({ arenaId: arena._id }).toArray();
            const needsRepair = assignments.some(a => a.position === null || a.position === undefined);

            if (needsRepair) {
                console.log(`Resetting Arena for Repair: ${arena.name}`);
                
                // Set it back to revealed=false. 
                // The CRON JOB we just set up will catch this and settle it correctly using the hardening logic!
                await mongoose.connection.db.collection('arenas').updateOne(
                    { _id: arena._id },
                    { $set: { status: 'revealed', isRevealed: false } }
                );
                
                count++;
            }
        }

        console.log(`Repaired ${count} arenas. The background cron system will now re-process them with correct data shortly!`);

    } catch (err) {
        console.error("Repair Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

repair();
