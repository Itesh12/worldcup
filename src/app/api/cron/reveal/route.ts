import { NextRequest, NextResponse } from "next/server";
import { processAllPendingReveals } from "@/lib/revealLogic";

/**
 * CRON Task: Reveal Position Drafts T-30 Minutes before match starts
 * Recommended frequency: Every 1-2 minutes
 */
export async function GET(req: NextRequest) {
    try {
        // Simple security check using CRON_SECRET from env
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const result = await processAllPendingReveals();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...result
        });
    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ 
            success: false, 
            message: error.message 
        }, { status: 500 });
    }
}

// Support POST just in case some cron services prefer it
export async function POST(req: NextRequest) {
    return GET(req);
}
