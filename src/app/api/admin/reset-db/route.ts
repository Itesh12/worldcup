import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Match from "@/models/Match";
import BattingSlot from "@/models/BattingSlot";
import BattingResolution from "@/models/BattingResolution";
import SlotScore from "@/models/SlotScore";
import UserMatchStats from "@/models/UserMatchStats";
import UserBattingAssignment from "@/models/UserBattingAssignment";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        // rigorous admin check
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 1. Clear Game Data Collections
        await Promise.all([
            Match.deleteMany({}),
            BattingSlot.deleteMany({}),
            BattingResolution.deleteMany({}),
            SlotScore.deleteMany({}),
            UserMatchStats.deleteMany({}),
            UserBattingAssignment.deleteMany({}),
        ]);

        // 2. Clear Users (Except Admins)
        // We preserve users with role 'admin' so they can still login.
        // However, their participation data (assignments, stats) is already wiped above.
        const result = await User.deleteMany({ role: { $ne: 'admin' } });

        return NextResponse.json({
            message: "Database reset successful",
            details: {
                usersDeleted: result.deletedCount,
                adminPreserved: true
            }
        });

    } catch (error: any) {
        console.error("Database Reset Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
