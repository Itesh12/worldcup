import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SubAdminConfig from "@/models/SubAdminConfig";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

/**
 * The 'Big Reveal' Logic (T-30 Minutes)
 * 1. Fetches all assignments for an arena
 * 2. Randomly shuffles their positions (1 to maxSlots)
 * 3. Calculates and credits Sub-Admin commissions
 * 4. Updates the assignments and sets the arena as revealed
 */
export async function revealArenaPositions(arenaId: string) {
    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
        await connectDB();

        // 1. Fetch Arena
        const arena = await Arena.findById(arenaId).session(mongooseSession);
        if (!arena) throw new Error("Arena not found");
        if (arena.isRevealed) return { message: "Already revealed" };

        // 2. Fetch Assignments
        const assignments = await UserBattingAssignment.find({ arenaId }).session(mongooseSession);
        if (assignments.length === 0) {
            arena.isRevealed = true;
            arena.status = 'revealed';
            await arena.save({ session: mongooseSession });
            await mongooseSession.commitTransaction();
            return { message: "No players in arena to reveal" };
        }

        // 3. Prepare Positions Array (1 to maxSlots)
        let positions = Array.from({ length: arena.maxSlots }, (_, i) => i + 1);

        // 4. SHUFFLE Algorithm (Fisher-Yates)
        const shuffle = (array: any[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const shuffledPositions = shuffle(positions);

        // 5. Assign Shuffled Positions to Users
        const updates = assignments.map((assignment, index) => {
            return UserBattingAssignment.findByIdAndUpdate(
                assignment._id,
                { position: shuffledPositions[index] },
                { session: mongooseSession }
            );
        });

        await Promise.all(updates);

        // 6. CALCULATE & DISTRIBUTE COMMISSIONS (Admin + Organizer)
        const totalEntryFees = assignments.length * arena.entryFee;
        
        // 6a. Admin Platform Commission
        if (arena.adminCommissionPercentage > 0) {
            const adminCommission = (totalEntryFees * arena.adminCommissionPercentage) / 100;
            // Find the main admin wallet (first admin user)
            const mainAdmin = await User.findOne({ role: 'admin' }).session(mongooseSession);
            
            if (mainAdmin && adminCommission > 0) {
                await Transaction.create([{
                    userId: mainAdmin._id,
                    amount: adminCommission,
                    type: 'commission',
                    description: `Platform Fee from Arena: ${arena.name} (${assignments.length} slots)`,
                    referenceId: arenaId,
                    status: 'pending'
                }], { session: mongooseSession });
            }
        }

        // 6b. Organizer/Sub-Admin Commission
        if (arena.organizerCommissionPercentage > 0 && arena.createdBy) {
            const organizerCommission = (totalEntryFees * arena.organizerCommissionPercentage) / 100;
            const creatorId = arena.createdBy;
            const creator = await User.findById(creatorId).session(mongooseSession);
            const isSubAdmin = creator && creator.role === 'subadmin';

            if (organizerCommission > 0 && isSubAdmin) {
                await Transaction.create([{
                    userId: creatorId,
                    amount: organizerCommission,
                    type: 'commission',
                    description: `Organizer Fee from Arena: ${arena.name} (${assignments.length} slots)`,
                    referenceId: arenaId,
                    status: 'pending'
                }], { session: mongooseSession });
            }
        }

        // 7. Update Arena Status
        arena.isRevealed = true;
        arena.status = 'revealed';
        await arena.save({ session: mongooseSession });

        await mongooseSession.commitTransaction();
        return { 
            message: `Successfully revealed ${assignments.length} positions for arena: ${arena.name}`,
            count: assignments.length,
            pool: totalEntryFees
        };

    } catch (error: any) {
        await mongooseSession.abortTransaction();
        throw error;
    } finally {
        mongooseSession.endSession();
    }
}
export async function processAllPendingReveals() {
    try {
        await connectDB();
        const now = new Date();

        // Find all arenas that should be revealed but aren't yet
        const pendingArenas = await Arena.find({
            isRevealed: false,
            revealTime: { $lte: now },
            status: { $ne: 'completed' }
        });

        if (pendingArenas.length === 0) {
            return { message: "No arenas pending reveal", count: 0 };
        }

        console.log(`Cron - Found ${pendingArenas.length} arenas awaiting reveal.`);
        
        const results = [];
        for (const arena of pendingArenas) {
            try {
                const result = await revealArenaPositions(arena._id.toString());
                results.push({ name: arena.name, success: true, ...result });
            } catch (error: any) {
                console.error(`Cron - Failed to reveal ${arena.name}:`, error.message);
                results.push({ name: arena.name, success: false, error: error.message });
            }
        }

        return {
            message: `Processed ${pendingArenas.length} arenas`,
            count: pendingArenas.length,
            details: results
        };
    } catch (error: any) {
        console.error("Cron - Bulk reveal error:", error);
        throw error;
    }
}

export async function finalizeMatchCommissions(matchId: string, matchStatus: string) {
    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();
    try {
        await connectDB();
        
        // Find arenas for this match
        const arenas = await Arena.find({ matchId }).session(mongooseSession);
        const arenaIds = arenas.map(a => a._id.toString());
        if (arenaIds.length === 0) {
            await mongooseSession.abortTransaction();
            return;
        }

        // Find all pending commission transactions for these arenas
        const pendingTxs = await Transaction.find({
            type: 'commission',
            status: 'pending',
            referenceId: { $in: arenaIds }
        }).session(mongooseSession);

        if (pendingTxs.length === 0) {
            await mongooseSession.abortTransaction();
            return;
        }

        const isAbandoned = ['abandoned', 'cancelled', 'no result'].includes(matchStatus.toLowerCase());

        for (const tx of pendingTxs) {
            if (isAbandoned) {
                // Cancel commission due to refund
                tx.status = 'failed';
                tx.description = tx.description + ' (Match Abandoned - Refunded)';
                await tx.save({ session: mongooseSession });
            } else {
                // Execute final commission payout
                tx.status = 'completed';
                await tx.save({ session: mongooseSession });

                // Distribute funds to Wallet Balance & Stats
                await User.findByIdAndUpdate(tx.userId, {
                    $inc: { balance: tx.amount, commissionEarned: tx.amount }
                }, { session: mongooseSession });

                // If subadmin, also update config master totals
                await SubAdminConfig.findOneAndUpdate(
                    { subAdminId: tx.userId },
                    { $inc: { totalCommissionEarned: tx.amount, balance: tx.amount } },
                    { session: mongooseSession }
                );
            }
        }
        await mongooseSession.commitTransaction();
    } catch(e) {
        await mongooseSession.abortTransaction();
        console.error("Failed to finalize commissions for match", matchId, e);
    } finally {
        mongooseSession.endSession();
    }
}
