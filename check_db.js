const mongoose = require('mongoose');

// Use simple require for diagnostic script
const UserSchema = new mongoose.Schema({
    email: String,
    withdrawalMethods: Array
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function check() {
    try {
        console.log("Connecting to database...");
        // Use environment variable from process.env if available, or try to load .env.local
        const uri = "mongodb://localhost:27017/worldcup"; // Fallback to local default if env missing
        await mongoose.connect(process.env.MONGODB_URI || uri);
        
        console.log("Searching for users with withdrawal methods...");
        const users = await User.find({ "withdrawalMethods.0": { $exists: true } });
        
        console.log(`Found ${users.length} users with payout methods.`);
        
        users.forEach(u => {
            console.log(`User: ${u.email}`);
            console.log(`Methods:`, JSON.stringify(u.withdrawalMethods, null, 2));
        });

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

check();
