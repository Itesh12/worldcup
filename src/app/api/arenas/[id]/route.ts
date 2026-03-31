import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";

/**
 * Handle Arena Management (Delete/Cancel)
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: arenaId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const user = session.user as any;

    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
        await connectDB();

        const arena = await Arena.findById(arenaId).session(mongooseSession);
        if (!arena) throw new Error("Arena not found");

        // 1. Permission Check: Admin can delete anything, SubAdmin/User only their own
        if (user.role !== 'admin' && arena.createdBy.toString() !== user.id) {
            throw new Error("You do not have permission to cancel this arena");
        }

        // 2. Status Check: Can't cancel if already locked/completed
        if (['locked', 'revealed', 'completed'].includes(arena.status)) {
            throw new Error(`Cannot cancel arena in ${arena.status} status`);
        }

        // 3. Refund Users if any joined
        if (arena.slotsCount > 0) {
            const assignments = await UserBattingAssignment.find({ arenaId }).session(mongooseSession);
            
            for (const assignment of assignments) {
                // Refund entry fee
                const joinedUser = await User.findById(assignment.userId).session(mongooseSession);
                if (joinedUser) {
                    joinedUser.walletBalance += arena.entryFee;
                    await joinedUser.save({ session: mongooseSession });

                    // Create Refund Transaction
                    await Transaction.create([{
                        userId: joinedUser._id,
                        amount: arena.entryFee,
                        type: 'refund',
                        description: `Refund: Cancelled Arena ${arena.name}`,
                        status: 'completed',
                        referenceId: arenaId
                    }], { session: mongooseSession });
                }
            }

            // Delete all assignments
            await UserBattingAssignment.deleteMany({ arenaId }).session(mongooseSession);
        }

        // 4. Delete the Arena
        await Arena.findByIdAndDelete(arenaId).session(mongooseSession);

        await mongooseSession.commitTransaction();
        return NextResponse.json({ message: "Arena cancelled and users refunded successfully" });

    } catch (error: any) {
        await mongooseSession.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        mongooseSession.endSession();
    }
}
