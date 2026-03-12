const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const UserSchema = new mongoose.Schema({
    email: String,
    withdrawalMethods: mongoose.Schema.Types.Mixed
}, { strict: false });

async function check() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI not found in .env.local");

        console.log("Connecting to:", uri.split('@')[1] || "local db");
        await mongoose.connect(uri);
        
        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        
        console.log("Searching for users...");
        const users = await User.find({ "withdrawalMethods": { $exists: true } });
        
        console.log(`Found ${users.length} users with withdrawalMethods field.`);
        
        users.forEach(u => {
            console.log(`\nUser: ${u.email}`);
            console.log(`Methods Count: ${Array.isArray(u.withdrawalMethods) ? u.withdrawalMethods.length : 'Not an array'}`);
            if (Array.isArray(u.withdrawalMethods)) {
                u.withdrawalMethods.forEach((m, i) => {
                    console.log(`  [${i}] ID: ${m._id || 'MISSING'}, Label: ${m.label}, Details: ${m.details}`);
                });
            }
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error("FATAL ERROR:", err.message);
        process.exit(1);
    }
}

check();
