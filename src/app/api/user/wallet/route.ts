import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const userId = (session.user as any).id;

        const user = await User.findById(userId).select('walletBalance').lean() as any;
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        return NextResponse.json({
            balance: user.walletBalance || 0,
            transactions
        });
    } catch (error: any) {
        console.error("Wallet API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
