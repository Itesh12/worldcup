import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { amount, method, accountDetails } = await req.json();

        if (!amount || isNaN(amount) || amount < 100) {
            return NextResponse.json({ error: "Minimum withdrawal amount is ₹100" }, { status: 400 });
        }

        await connectDB();
        const userId = (session.user as any).id;
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.walletBalance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // 1. Deduct balance from user wallet
        user.walletBalance -= amount;
        await user.save();

        // 2. Create a pending withdrawal transaction
        const transaction = await Transaction.create({
            userId,
            amount: -amount, // Debit
            type: 'withdrawal',
            description: `Withdrawal Request (${method})`,
            status: 'pending',
            // Storing payment details in metadata if the schema allows or just as part of description
            // For now, let's just use the description or assume metadata field exists
            // Since we didn't check metadata in Transaction schema yet, let's be safe.
        });

        // If we want to store account details for admin, we should probably add it to the transaction model 
        // or a separate Withdrawal model. Given the current structure, adding to Transaction description
        // or using a generic metadata field if it exists.
        
        // Update: Let's assume we can store it in a generic field or description for the admin.
        transaction.description = `Withdrawal: ${amount} via ${method} (${accountDetails})`;
        await transaction.save();

        return NextResponse.json({
            message: "Withdrawal request submitted successfully",
            balance: user.walletBalance,
            transaction
        });
    } catch (error: any) {
        console.error("Withdrawal Request API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
