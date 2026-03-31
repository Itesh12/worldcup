import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Arena from "@/models/Arena";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * Handle Joining an Arena (Contest Entry)
 */
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { arenaId, inningsNumber } = await req.json();
    const userId = (session.user as any).id;

    if (!arenaId || !inningsNumber) {
        return NextResponse.json({ message: "Arena selection and Innings number are required" }, { status: 400 });
    }

    const arenaObjectId = new mongoose.Types.ObjectId(arenaId);

    const mongooseSession = await mongoose.startSession();
    mongooseSession.startTransaction();

    try {
        await connectDB();

        // 1. Fetch Arena & User
        const arena = await Arena.findById(arenaObjectId).session(mongooseSession);
        const user = await User.findById(userId).session(mongooseSession);

        if (!arena) throw new Error("Arena not found");
        if (!user) throw new Error("User not found");

        // 2. Deadline & Space Check
        const now = new Date();
        if (arena.revealTime && now > arena.revealTime) {
            throw new Error("Contest entry closed. Positions are being revealed.");
        }

        if (arena.slotsCount >= arena.maxSlots) {
            throw new Error("Arena is full");
        }

        // 3. Balance Check
        if (user.walletBalance < arena.entryFee) {
            throw new Error("Insufficient wallet balance");
        }

        // 4. Duplicate Check
        const existing = await UserBattingAssignment.findOne({
            arenaId: arenaObjectId,
            userId,
            inningsNumber
        }).session(mongooseSession);

        if (existing) {
            throw new Error("You have already joined this innings in this arena");
        }

        // 5. Debit Wallet
        user.walletBalance -= arena.entryFee;
        await user.save({ session: mongooseSession });

        // 6. Create Transaction
        await Transaction.create([{
            userId,
            amount: -arena.entryFee,
            type: 'bet_placed', // Using 'bet_placed' as a proxy for contest_entry
            description: `Contest Entry: ${arena.name} (Innings ${inningsNumber})`,
            status: 'completed',
            referenceId: arenaId.toString()
        }], { session: mongooseSession });

        // 7. Create Assignment Record (Position is NULL - Revealed at T-30)
        const assignment = await UserBattingAssignment.create([{
            tournamentId: arena.tournamentId,
            matchId: arena.matchId,
            arenaId: arenaObjectId,
            userId,
            inningsNumber: Number(inningsNumber),
            position: null
        }], { session: mongooseSession });

        // 8. Update Arena Counter
        arena.slotsCount += 1;
        if (arena.slotsCount === arena.maxSlots) {
            arena.status = 'full';
        }
        await arena.save({ session: mongooseSession });

        await mongooseSession.commitTransaction();
        return NextResponse.json({
            message: "Joined arena successfully. Your position will be revealed 30 mins before the match.",
            assignment: assignment[0]
        });

    } catch (error: any) {
        await mongooseSession.abortTransaction();
        return NextResponse.json({ message: error.message }, { status: 500 });
    } finally {
        mongooseSession.endSession();
    }
}
