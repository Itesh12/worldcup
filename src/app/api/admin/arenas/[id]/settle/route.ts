import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Arena from '@/models/Arena';
import Match from '@/models/Match';
import UserBattingAssignment from '@/models/UserBattingAssignment';
import SlotScore from '@/models/SlotScore';
import User from '@/models/User';
import Transaction from '@/models/Transaction';
import mongoose from 'mongoose';
import { finalizeMatchCommissions } from '@/lib/revealLogic';

/**
 * POST /api/admin/arenas/[id]/settle
 * Quick Settlement for Administrators
 * 1. Verifies match status is finished
 * 2. Calculates and distributes commissions
 * 3. Identifies winner based on most runs
 * 4. Credits winner's wallet and updates arena status
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: arenaId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
        await connectDB();

        // 1. Fetch Arena and Match
        const arena = await Arena.findById(arenaId).populate('matchId').session(mongooseSession);
        if (!arena) throw new Error("Arena not found");
        if (arena.status === 'completed') throw new Error("Arena already settled");

        const match = arena.matchId;
        if (!['finished', 'completed', 'result', 'settled'].includes(match.status)) {
            throw new Error(`Match is still ${match.status}. Cannot settle.`);
        }

        // 2. Finalize Commissions (Uses existing revealLogic utility)
        await finalizeMatchCommissions(match._id.toString(), match.status);

        // 3. Identification of Winners
        const assignments = await UserBattingAssignment.find({ arenaId }).session(mongooseSession);
        if (assignments.length === 0) {
            arena.status = 'completed';
            await arena.save({ session: mongooseSession });
            await mongooseSession.commitTransaction();
            return NextResponse.json({ message: "Arena settled (no players to pay)" });
        }

        // Fetch scores for all joined positions
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

        // Sort by Runs DESC, then Balls ASC
        scoresWithUser.sort((a, b) => {
            if (b.runs !== a.runs) return b.runs - a.runs;
            return a.balls - b.balls;
        });

        // 4. Calculate Payout Pool
        // Prize Pool = (JoinedCount * EntryFee) - PlatformCommission - OrganizerCommission
        const totalRevenue = assignments.length * arena.entryFee;
        const adminCommission = (totalRevenue * arena.adminCommissionPercentage) / 100;
        const organizerCommission = (totalRevenue * arena.organizerCommissionPercentage) / 100;
        const prizePool = totalRevenue - adminCommission - organizerCommission;

        // 5. Distribution (Simple Winner-Takes-All for now, or split if tie)
        if (prizePool > 0) {
            const topScore = scoresWithUser[0].runs;
            const winners = scoresWithUser.filter(s => s.runs === topScore && s.runs > 0);

            if (winners.length > 0) {
                const prizePerWinner = prizePool / winners.length;
                for (const winner of winners) {
                    const winnerUser = await User.findById(winner.assignment.userId).session(mongooseSession);
                    if (winnerUser) {
                        winnerUser.balance += prizePerWinner;
                        await winnerUser.save({ session: mongooseSession });

                        await Transaction.create([{
                            userId: winnerUser._id,
                            amount: prizePerWinner,
                            type: 'winnings',
                            description: `Winnings: ${arena.name} (Rank #1)`,
                            status: 'completed',
                            referenceId: arenaId
                        }], { session: mongooseSession });
                    }
                }
            }
        }

        // 6. Final Status Update
        arena.status = 'completed';
        await arena.save({ session: mongooseSession });

        await mongooseSession.commitTransaction();
        return NextResponse.json({ message: "Arena settled and winners paid out successfully" });

    } catch (error: any) {
        await mongooseSession.abortTransaction();
        console.error("Settlement Error:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        mongooseSession.endSession();
    }
}
