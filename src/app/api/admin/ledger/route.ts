import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Transaction from "@/models/Transaction";
import Arena from "@/models/Arena";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = req.nextUrl;
        
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "50");
        const type = searchParams.get("type") || "all";
        
        const skip = (page - 1) * limit;

        const query: any = {};
        
        if (type !== 'all') {
            query.type = type;
        }

        const rawTransactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "name")
            .lean();

        // Attach Source User details manually for transparency
        const enrichedTransactions = await Promise.all(rawTransactions.map(async (tx: any) => {
            if (tx.type === 'commission' && tx.referenceId) {
                const arena = await Arena.findById(tx.referenceId).populate('createdBy', 'name').lean() as any;
                if (arena && arena.createdBy) {
                    tx.sourceUser = arena.createdBy.name;
                }
            }
            return tx;
        }));

        const totalTransactions = await Transaction.countDocuments(query);

        return NextResponse.json({
            data: enrichedTransactions,
            pagination: {
                total: totalTransactions,
                pages: Math.ceil(totalTransactions / limit),
                current: page,
                limit
            }
        });

    } catch (error) {
        console.error("Ledger API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
