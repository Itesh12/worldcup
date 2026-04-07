import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import Transaction from '@/models/Transaction';

/**
 * GET /api/user/wallet/transactions
 * Returns all transactions for the logged-in user, sorted by newest first.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const userId = (session.user as any).id;
        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .limit(100) // Default limit to avoid huge payload
            .lean();

        return NextResponse.json(transactions);
    } catch (error: any) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
