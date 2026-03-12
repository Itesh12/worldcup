import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount, description, type = 'deposit' } = await req.json();

        if (!amount || isNaN(amount) || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        await connectDB();
        const userId = (session.user as any).id;

        // Start a session for transaction safety if needed, 
        // but for now simple update + create
        const user = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: amount } },
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const transaction = await Transaction.create({
            userId,
            amount,
            type,
            description: description || "Added to wallet",
            status: 'completed'
        });

        return NextResponse.json({
            message: "Funds added successfully",
            balance: user.walletBalance,
            transaction
        });
    } catch (error: any) {
        console.error("Wallet Add API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
