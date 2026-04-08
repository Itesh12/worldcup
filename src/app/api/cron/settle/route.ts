import { NextRequest, NextResponse } from "next/server";
import { processAllPendingSettlements } from "@/lib/revealLogic";

/**
 * CRON Task: Auto-Settle Finished Matches (20 min buffer)
 * Path: /api/cron/settle
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        
        // Simple security check using CRON_SECRET from env
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const result = await processAllPendingSettlements();

        return NextResponse.json({ 
            status: "Cron Settlement successful", 
            ...result 
        });

    } catch (error: any) {
        console.error("Cron Settle Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// Support POST just in case
export async function POST(req: NextRequest) {
    return GET(req);
}
