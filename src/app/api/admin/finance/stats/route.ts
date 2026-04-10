import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 1. Total Platform Revenue (Admin's Share)
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(a => a._id);
        
        const revenueResult = await Transaction.aggregate([
            { $match: { userId: { $in: adminIds }, type: 'commission', status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // 2. Active Stakes (Escrowed Prize Pools)
        // This is the total amount currently held for active contests (EntryFees - Commissions)
        // We'll calculate it from transactions of type 'bet_placed' that aren't settled/refunded yet.
        // For simplicity in this logic, Stakes = Sum(Abs(bet_placed)) - Sum(Commissions related to those joins)
        // But simpler: Total Liability = (All Players Wallet Sum) + (Total Entry Fees Staked - Paid out)
        
        const stakesResult = await Transaction.aggregate([
            { $match: { type: 'bet_placed', status: 'completed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalStaked = stakesResult[0]?.total || 0;

        // We must subtract the commissions already distributed from the staked total to avoid double counting
        const commsDistributedResult = await Transaction.aggregate([
            { $match: { type: 'commission', status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalComms = commsDistributedResult[0]?.total || 0;
        const activePrizePool = Math.max(0, totalStaked - totalComms);

        // 3. User Cash (Available Player Wallets)
        const userCashResult = await User.aggregate([
            { $match: { role: { $in: ['user', 'player'] } } }, 
            { $group: { _id: null, total: { $sum: "$walletBalance" } } }
        ]);
        const totalUserCash = userCashResult[0]?.total || 0;

        // Total Liability = User Cash + Prize Pools currently in escrow
        const totalLiability = totalUserCash + activePrizePool;

        // 4. Partner Earnings (Sum of Sub-Admin balances)
        const subAdminResult = await User.aggregate([
            { $match: { role: 'subadmin' } },
            { $group: { _id: null, total: { $sum: "$walletBalance" } } }
        ]);
        const subAdminOwed = subAdminResult[0]?.total || 0;

        // 5. Pending Withdrawals
        const pendingWithdrawalResult = await Transaction.aggregate([
            { $match: { type: 'withdrawal', status: 'pending' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const pendingWithdrawals = pendingWithdrawalResult[0]?.total || 0;

        return NextResponse.json({
            totalRevenue,
            totalLiability,
            totalUserCash,
            activePrizePool,
            subAdminOwed,
            pendingWithdrawals,
            totalStaked // For debugging/additional info
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
