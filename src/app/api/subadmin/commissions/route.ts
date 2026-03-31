import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        
        if (!session || (user.role !== 'subadmin' && user.role !== 'admin')) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Fetch all commission transactions for this sub-admin
        const commissions = await Transaction.find({
            userId: user.id,
            type: 'commission'
        }).sort({ createdAt: -1 });

        return NextResponse.json(commissions);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
