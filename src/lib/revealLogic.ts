import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import Match from "@/models/Match";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SubAdminConfig from "@/models/SubAdminConfig";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import UserMatchStats from "@/models/UserMatchStats";
import SlotScore from "@/models/SlotScore";
import Notification from "@/models/Notification";
import { createNotification, notifyAdmins, notifyUsersInArena } from "./notificationLogic";
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

        // 3. Prepare Pool of Inning/Position Combinations
        // For even numbers (2,4,6,8,10): Split equally (max/2)
        // For odd numbers (if any): Round 1st inning up
        const slotsPerInning1 = Math.ceil(arena.maxSlots / 2);
        
        const slotPool: { inningsNumber: number, position: number }[] = [];
        
        // Inning 1 Slots
        for (let i = 1; i <= slotsPerInning1; i++) {
            slotPool.push({ inningsNumber: 1, position: i });
        }
        
        // Inning 2 Slots
        for (let i = 1; i <= (arena.maxSlots - slotsPerInning1); i++) {
            slotPool.push({ inningsNumber: 2, position: i });
        }

        // 4. SHUFFLE Algorithm (Fisher-Yates) to randomize the assignments
        const shuffle = (array: any[]) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const shuffledSlots = shuffle(slotPool);

        // 5. Assign Shuffled Inning + Position to Users
        const updates = assignments.map((assignment, index) => {
            const slot = shuffledSlots[index];
            return UserBattingAssignment.findByIdAndUpdate(
                assignment._id,
                { 
                    inningsNumber: slot.inningsNumber,
                    position: slot.position 
                },
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

        arena.isRevealed = true;
        arena.status = 'revealed';
        await arena.save({ session: mongooseSession });

        // User Notification for Reveal
        await notifyUsersInArena(arenaId, {
            title: "Arena Positions Revealed! 🏏",
            message: `Check your batting number for ${arena.name}. The match is starting soon!`,
            type: 'match',
            link: `/matches/${arena.matchId._id || arena.matchId}`
        });

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

/**
 * Core Settlement Logic for an Arena
 */
export async function settleArena(arenaId: string, providedSession?: mongoose.ClientSession) {
    const mongooseSession = providedSession || await mongoose.startSession();
    if (!providedSession) mongooseSession.startTransaction();

    try {
        await connectDB();

        // 1. Fetch Arena and Match
        const arena = await Arena.findById(arenaId).populate('matchId').session(mongooseSession);
        if (!arena) throw new Error("Arena not found");
        if (arena.status === 'completed') return { success: false, message: "Arena already settled" };

        // SELF-HEALING: If arena was never revealed, reveal it now before settling
        if (!arena.isRevealed) {
            console.log(`Self-Healing: Arena ${arena.name} was not revealed. Triggering reveal before settlement.`);
            // We can't easily call revealArenaPositions here because of nested transaction sessions
            // So we manually perform the shuffle logic for this specific arena
            const assignments = await UserBattingAssignment.find({ arenaId }).session(mongooseSession);
            if (assignments.length > 0) {
                const slotsPerInning1 = Math.ceil(arena.maxSlots / 2);
                const slotPool = [];
                for (let i = 1; i <= slotsPerInning1; i++) slotPool.push({ inningsNumber: 1, position: i });
                for (let i = 1; i <= (arena.maxSlots - slotsPerInning1); i++) slotPool.push({ inningsNumber: 2, position: i });
                
                // Shuffle
                for (let i = slotPool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [slotPool[i], slotPool[j]] = [slotPool[j], slotPool[i]];
                }

                // Update assignments
                for (let i = 0; i < assignments.length; i++) {
                    assignments[i].inningsNumber = slotPool[i].inningsNumber;
                    assignments[i].position = slotPool[i].position;
                    await assignments[i].save({ session: mongooseSession });
                }
            }
            arena.isRevealed = true;
            arena.status = 'revealed';
            await arena.save({ session: mongooseSession });
        }

        const match = arena.matchId;
        if (!['finished', 'completed', 'result', 'settled'].includes(match.status)) {
            throw new Error(`Match is still ${match.status}. Cannot settle.`);
        }

        // 2. Finalize Commissions
        await finalizeMatchCommissions(match._id.toString(), match.status);

        // 3. Identification of Winners
        const assignments = await UserBattingAssignment.find({ arenaId }).session(mongooseSession);
        if (assignments.length === 0) {
            arena.status = 'completed';
            await arena.save({ session: mongooseSession });
            if (!providedSession) await mongooseSession.commitTransaction();
            return { success: true, message: "Arena settled (no players)" };
        }

        const scoresWithUser = [];
        for (const assignment of assignments) {
            const score = await SlotScore.findOne({
                matchId: match._id,
                inningsNumber: assignment.inningsNumber,
                position: assignment.position
            }).session(mongooseSession);

            scoresWithUser.push({
                assignment,
                runs: score?.runs || 0,
                balls: score?.balls || 0
            });
        }

        scoresWithUser.sort((a, b) => {
            if (b.runs !== a.runs) return b.runs - a.runs;
            return a.balls - b.balls;
        });

        // 4. Calculate Payout Pool
        const totalRevenue = assignments.length * arena.entryFee;
        const adminCommission = (totalRevenue * arena.adminCommissionPercentage) / 100;
        const organizerCommission = (totalRevenue * arena.organizerCommissionPercentage) / 100;
        const prizePool = totalRevenue - adminCommission - organizerCommission;

        // 5. Distribution
        if (prizePool > 0) {
            const topScore = scoresWithUser[0].runs;
            const winners = scoresWithUser.filter(s => s.runs === topScore && s.runs > 0);

            if (winners.length > 0) {
                const prizePerWinner = prizePool / winners.length;
                for (const winner of winners) {
                    const winnerUser = await User.findById(winner.assignment.userId).session(mongooseSession);
                    if (winnerUser) {
                        winnerUser.walletBalance += prizePerWinner; // Fixed field name to walletBalance
                        await winnerUser.save({ session: mongooseSession });

                        await Transaction.create([{
                            userId: winnerUser._id,
                            amount: prizePerWinner,
                            type: 'winnings',
                            description: `Winnings: ${arena.name} (Rank #1)`,
                            status: 'completed',
                            referenceId: arenaId
                        }], { session: mongooseSession });

                        // User Notification
                        await createNotification(winnerUser._id.toString(), {
                            title: "Champion! 🏆",
                            message: `You won ₹${prizePerWinner.toLocaleString()} in Arena: ${arena.name}`,
                            type: 'money',
                            link: `/wallet/history`
                        });
                    }
                }
            }
        }

        arena.status = 'completed';
        await arena.save({ session: mongooseSession });

        // General Settlement Notification for All Participants
        await notifyUsersInArena(arenaId, {
            title: "Arena Settled! ✅",
            message: `Results for ${arena.name} are finalized. Check the leaderboard!`,
            type: 'success',
            link: `/matches/${match._id}`
        });

        if (!providedSession) await mongooseSession.commitTransaction();
        return { success: true, message: "Arena settled successfully" };

    } catch (error: any) {
        if (!providedSession) await mongooseSession.abortTransaction();
        throw error;
    } finally {
        if (!providedSession) mongooseSession.endSession();
    }
}

/**
 * Cron Batch Processor: Finds all arenas for finalized matches and settles them
 */
export async function processAllPendingSettlements() {
    try {
        await connectDB();
        
        // Safety Buffer: 20 minutes ago
        const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);

        // 1. Find matches that finished > 20 mins ago
        const finalizedMatches = await Match.find({
            status: { $in: ['finished', 'completed', 'result', 'settled'] },
            updatedAt: { $lte: twentyMinsAgo }
        }).select('_id name');

        if (finalizedMatches.length === 0) {
            return { message: "No finalized matches pending settlement buffer.", count: 0 };
        }

        const matchIds = finalizedMatches.map(m => m._id);

        // 2. Find revealed/live arenas linked to these matches
        const pendingArenas = await Arena.find({
            matchId: { $in: matchIds },
            status: { $ne: 'completed' }
        });

        if (pendingArenas.length === 0) {
            return { message: "No arenas pending settlement for finalized matches.", count: 0 };
        }

        console.log(`Cron - Found ${pendingArenas.length} arenas to auto-settle.`);
        
        let successCount = 0;
        const details = [];

        for (const arena of pendingArenas) {
            try {
                await settleArena(arena._id.toString());
                successCount++;
                details.push({ id: arena._id, name: arena.name, success: true });
            } catch (err: any) {
                console.error(`Cron - Failed to settle ${arena.name}:`, err.message);
                details.push({ id: arena._id, name: arena.name, success: false, error: err.message });
            }
        }

        // 3. Notify Admins of daily settlement activity
        if (successCount > 0) {
            await notifyAdmins({
                title: "Auto-Settlement Report",
                message: `Successfully settled ${successCount} arenas automatically.`,
                type: 'success',
                link: '/admin/reports'
            });
        }

        return {
            message: `Processed ${pendingArenas.length} arenas`,
            successCount,
            details
        };

    } catch (error: any) {
        console.error("Cron - Bulk settlement error:", error);
        throw error;
    }
}
