import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import User from "@/models/User";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import Transaction from "@/models/Transaction";
import { revealArenaPositions } from "@/lib/revealLogic";
import mongoose from "mongoose";

async function verifyFranchiseFlow() {
    const runId = Date.now().toString().slice(-6);
    console.log(`🚀 Starting Franchise Model Verification [RUN: ${runId}]...`);

    try {
        await connectDB();

        // 1. Setup Mock Sub-Admin
        console.log("Setting up sub-admin...");
        const subAdminEmail = `subadmin_${runId}@verify.com`;
        const subAdmin = await User.create({
            name: `Verify SA ${runId}`,
            email: subAdminEmail,
            password: "password123",
            role: "subadmin",
            walletBalance: 1000,
            commissionEarned: 0
        });

        const SubAdminConfig = mongoose.models.SubAdminConfig || mongoose.model('SubAdminConfig', new mongoose.Schema({
            subAdminId: mongoose.Schema.Types.ObjectId,
            brandName: String,
            commissionPercentage: Number,
            isActive: Boolean
        }));

        console.log("Configuring sub-admin revenue share (15%)...");
        await SubAdminConfig.create({
            subAdminId: subAdmin._id,
            brandName: `League ${runId}`,
            commissionPercentage: 15,
            isActive: true
        });

        // 2. Create Arena
        console.log("Creating arena linked to sub-admin...");
        const fakeMatchId = new mongoose.Types.ObjectId();
        const fakeTournamentId = new mongoose.Types.ObjectId();
        const arena = await Arena.create({
            name: `Grand League ${runId}`,
            matchId: fakeMatchId,
            tournamentId: fakeTournamentId,
            createdBy: subAdmin._id,
            entryFee: 100,
            maxSlots: 10,
            isRevealed: false,
            inviteCode: `JOIN-${runId}`,
            status: 'open'
        });

        // 3. Simulating Users Joining (Total Pots = 100 * 4 = 400)
        console.log("Simulating 4 players joining...");
        for (let i = 0; i < 4; i++) {
            const player = await User.create({
                name: `Player ${i}_${runId}`,
                email: `player${i}_${runId}@verify.com`,
                password: "password123",
                role: "user",
                walletBalance: 200
            });

            await UserBattingAssignment.create({
                userId: player._id,
                matchId: fakeMatchId,
                arenaId: arena._id,
                inningsNumber: 1,
                position: null // Hidden initially
            });
        }

        // 4. TRIGGER REVEAL (T-30 Logic)
        console.log("Triggering revealArenaPositions (Fisher-Yates + Commission Settlement)...");
        const revealResult = await revealArenaPositions(arena._id.toString());
        console.log("Reveal Engine Result:", revealResult.message);

        // 5. Audit Results
        console.log("\n--- AUDIT LOG ---");
        const subAdminAfter = await User.findById(subAdmin._id);
        const commissionTx = await Transaction.findOne({ userId: subAdmin._id, type: 'commission' });

        console.log(`- Expected Commission (15% of 400): 60`);
        console.log(`- Actual Wallet Balance (commissionEarned): ${subAdminAfter?.commissionEarned}`);
        console.log(`- Transaction Audit Recorded: ${commissionTx ? "YES" : "NO"}`);
        if (commissionTx) {
            console.log(`- Transaction Description: ${commissionTx.description}`);
        }

        const sampleAssignment = await UserBattingAssignment.findOne({ arenaId: arena._id });
        console.log(`- Position Revealed for Player: ${sampleAssignment?.position ? "YES" : "NO"}`);

        if (subAdminAfter?.commissionEarned === 60 && commissionTx) {
            console.log("\n✅ [SUCCESS] Decentralized Franchise Model Verified!");
        } else {
            console.log("\n❌ [FAILURE] Logic verification failed. Check calculations.");
        }

    } catch (error: any) {
        console.error("❌ Fatal Error during verification:", error.message);
    } finally {
        process.exit(0);
    }
}

verifyFranchiseFlow();
