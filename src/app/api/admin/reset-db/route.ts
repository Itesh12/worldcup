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
import Arena from "@/models/Arena";
import Tournament from "@/models/Tournament";
import Transaction from "@/models/Transaction";
import SubAdminConfig from "@/models/SubAdminConfig";
import SystemLog from "@/models/SystemLog";
import Notification from "@/models/Notification";

export async function POST() {
    try {
        const session = await getServerSession(authOptions);

        // rigorous admin check
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 1. CLEAR EVERYTHING (Absolute Wipe)
        await Promise.all([
            Match.deleteMany({}),
            BattingSlot.deleteMany({}),
            BattingResolution.deleteMany({}),
            SlotScore.deleteMany({}),
            UserMatchStats.deleteMany({}),
            UserBattingAssignment.deleteMany({}),
            Arena.deleteMany({}),
            Tournament.deleteMany({}),
            Transaction.deleteMany({}),
            SubAdminConfig.deleteMany({}),
            SystemLog.deleteMany({}),
            Notification.deleteMany({}),
            User.deleteMany({}) // Absolute Wipe - deletes Admins too!
        ]);

        return NextResponse.json({
            message: "Absolute Database reset successful. 0 records remaining.",
            details: {
                totalWipe: true,
                adminPreserved: true
            }
        });

    } catch (error: any) {
        console.error("Database Reset Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
