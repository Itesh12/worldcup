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

        // 1. Total Platform Revenue (Sum of all commissions for Admin users)
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(a => a._id);
        
        const revenueResult = await Transaction.aggregate([
            { $match: { userId: { $in: adminIds }, type: 'commission', status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // 2. Active Liability (Total balance in all PLAYER wallets - Admin/SubAdmin are internal)
        const liabilityResult = await User.aggregate([
            { $match: { role: 'user' } }, 
            { $group: { _id: null, total: { $sum: "$walletBalance" } } }
        ]);
        const totalLiability = liabilityResult[0]?.total || 0;

        // 3. Sub-Admin Owed (Total walletBalance of all sub-admins - representing their earned commissions)
        const subAdminResult = await User.aggregate([
            { $match: { role: 'subadmin' } },
            { $group: { _id: null, total: { $sum: "$walletBalance" } } }
        ]);
        const subAdminOwed = subAdminResult[0]?.total || 0;

        // 4. Pending Withdrawals
        const pendingWithdrawalResult = await Transaction.aggregate([
            { $match: { type: 'withdrawal', status: 'pending' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const pendingWithdrawals = pendingWithdrawalResult[0]?.total || 0;

        // 5. Total Volume (Sum of all 'bet_placed' amounts)
        const volumeResult = await Transaction.aggregate([
            { $match: { type: 'bet_placed' } },
            { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalVolume = volumeResult[0]?.total || 0;

        return NextResponse.json({
            totalRevenue,
            totalLiability,
            subAdminOwed,
            pendingWithdrawals,
            totalVolume
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
