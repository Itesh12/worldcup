import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

// GET: List all withdrawal requests
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        const withdrawals = await Transaction.find({ type: 'withdrawal' })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(withdrawals);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Process a withdrawal (approve/reject)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { transactionId, action, adminNote } = await req.json();

        await connectDB();
        const transaction = await Transaction.findById(transactionId);
        
        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        if (transaction.status !== 'pending') {
            return NextResponse.json({ error: "Transaction already processed" }, { status: 400 });
        }

        if (action === 'approve') {
            transaction.status = 'completed';
            if (adminNote) transaction.description += ` (Admin Note: ${adminNote})`;
            await transaction.save();
        } else if (action === 'reject') {
            transaction.status = 'failed';
            if (adminNote) transaction.description += ` (Rejected: ${adminNote})`;
            await transaction.save();

            // Refund the user's wallet
            const refundAmount = Math.abs(transaction.amount);
            await User.findByIdAndUpdate(transaction.userId, {
                $inc: { walletBalance: refundAmount }
            });

            // Create a refund transaction entry for clarity
            await Transaction.create({
                userId: transaction.userId,
                amount: refundAmount,
                type: 'refund',
                description: `Refund for rejected withdrawal: ${transactionId}`,
                status: 'completed'
            });
        }

        return NextResponse.json({ message: `Withdrawal ${action}ed successfully` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
