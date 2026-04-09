import mongoose from 'mongoose';
import connectDB from '../src/lib/db';
import User from '../src/models/User';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function fixAuth() {
    try {
        console.log("🛠️ EMERGENCY AUTH RECOVERY INITIATED 🛠️");
        await connectDB();

        const NEW_PW = "Test@123";
        const SALT_ROUNDS = 12;
        const hashedPW = await bcrypt.hash(NEW_PW, SALT_ROUNDS);

        console.log("Checking accounts...");
        
        // 1. Admin
        const adminRes = await User.updateOne(
            { email: 'admin@worldcup.com' },
            { $set: { password: hashedPW, isBanned: false } }
        );
        console.log(`Admin Account: ${adminRes.modifiedCount > 0 ? "REPAIRED" : "UNTOUCHED (Already Good or Not Found)"}`);

        // 2. SubAdmins (1-5)
        let subCount = 0;
        for (let i = 1; i <= 5; i++) {
            const res = await User.updateOne(
                { email: `subadmin${i}@worldcup.com` },
                { $set: { password: hashedPW, isBanned: false } }
            );
            if (res.modifiedCount > 0) subCount++;
        }
        console.log(`Sub-Admins: ${subCount} REPAIRED`);

        // 3. Players (1-50)
        let playerCount = 0;
        for (let i = 1; i <= 50; i++) {
            const res = await User.updateOne(
                { email: `player${i}@worldcup.com` },
                { $set: { password: hashedPW, isBanned: false } }
            );
            if (res.modifiedCount > 0) playerCount++;
        }
        console.log(`Players: ${playerCount} REPAIRED`);

        const player12 = await User.findOne({ email: 'player12@worldcup.com' });
        if (player12) {
            const testMatch = await bcrypt.compare(NEW_PW, player12.password);
            console.log(`Verification (Player12): ${testMatch ? "✅ MATCHED" : "❌ FAILED"}`);
        }

        console.log("🚀 AUTH RECOVERY COMPLETE 🚀");
    } catch (err) {
        console.error("FATAL ERROR DURING REPAIR:", err);
    } finally {
        process.exit(0);
    }
}

fixAuth();
