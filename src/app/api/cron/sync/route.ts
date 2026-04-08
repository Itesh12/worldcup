import { NextRequest, NextResponse } from "next/server";

/**
 * CRON Task: Sync Match Statuses & Scores
 * Path: /api/cron/sync
 */
export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        
        // Simple security check using CRON_SECRET from env
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        // We trigger the existing sync API
        // In a production environment, you might want to call the logic directly
        // but fetching internally is a quick way to reuse the complex sync route.
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const host = req.headers.get('host');
        const baseUrl = `${protocol}://${host}`;
        
        const syncUrl = `${baseUrl}/api/sync`;
        
        const response = await fetch(syncUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        });

        if (!response.ok) {
            throw new Error(`Sync API failed with status ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json({ 
            status: "Cron Sync successful", 
            details: data 
        });

    } catch (error: any) {
        console.error("Cron Sync Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// Support POST just in case
export async function POST(req: NextRequest) {
    return GET(req);
}
