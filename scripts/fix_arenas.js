const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected for specific repair...");

        const ids = ['69d4db16e02186fdbe43d8a8', '69d4db1ae02186fdbe43d8ca'];
        
        for (const id of ids) {
            console.log(`Fixing Arena: ${id}`);
            // Reset to revealed=false so our new hardening logic treats it as "needs reveal"
            // and status='revealed' so settlement can proceed
            await mongoose.connection.db.collection('arenas').updateOne(
                { _id: new mongoose.Types.ObjectId(id) },
                { $set: { status: 'revealed', isRevealed: false } }
            );
        }

        console.log("Repair finished. The next sync will now correctly populate the data.");
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

fix();
