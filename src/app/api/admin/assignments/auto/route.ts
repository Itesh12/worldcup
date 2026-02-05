import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import BattingSlot from "@/models/BattingSlot";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { matchId } = await req.json();
        if (!matchId) {
            return NextResponse.json({ message: "MatchID required" }, { status: 400 });
        }

        await connectDB();

        // 1. Get all available users
        const users = await User.find({ role: 'user' });
        if (users.length === 0) {
            return NextResponse.json({ message: "No users available for assignment" }, { status: 404 });
        }

        // 2. Get all slots for this match
        const slots = await BattingSlot.find({ matchId }).sort({ inningsNumber: 1, position: 1 });
        if (slots.length === 0) {
            return NextResponse.json({ message: "No slots initialized for this match" }, { status: 404 });
        }

        // 3. Clear existing assignments for this match to prevent unique index conflicts
        await UserBattingAssignment.deleteMany({ matchId });

        // 5. Create assignments with match-wide true randomness
        // Each user gets exactly ONE slot in the whole match (across both innings)
        const assignments = [];

        // Shuffle the entire pool of 10 slots
        const shuffledSlots = [...slots].sort(() => Math.random() - 0.5);
        // Shuffle the available users
        const shuffledUsers = [...users].sort(() => Math.random() - 0.5);

        // Assign users to slots 1-to-1 across the whole match
        const limit = Math.min(shuffledSlots.length, shuffledUsers.length);

        for (let i = 0; i < limit; i++) {
            assignments.push({
                matchId: shuffledSlots[i].matchId,
                userId: shuffledUsers[i]._id,
                inningsNumber: shuffledSlots[i].inningsNumber,
                position: shuffledSlots[i].position
            });
        }

        await UserBattingAssignment.insertMany(assignments);

        return NextResponse.json({ message: "Auto-assignment complete", count: assignments.length });
    } catch (error: any) {
        console.error("Auto-assign error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
