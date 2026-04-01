import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Match from "@/models/Match";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const now = new Date();

        // 1. Fetch Live Matches
        let liveMatches = await Match.find({ status: "live" })
            .select("teams startTime _id liveScore matchDesc seriesName status venue")
            .lean();
        
        // 2. Sync if stale (only for live matches)
        const isStale = liveMatches.some(m => !m.liveScore?.lastUpdated || (now.getTime() - new Date(m.liveScore.lastUpdated).getTime()) > 30000);
        if (isStale) {
            const { syncLiveScores } = require("@/lib/scoreSync");
            // Non-blocking trigger
            syncLiveScores().catch(console.error);
        }

        // 3. Fallback: If no live matches, fetch today's upcoming matches
        if (liveMatches.length === 0) {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            
            liveMatches = await Match.find({ 
                status: "upcoming",
                startTime: { $gte: now, $lte: endOfToday }
            })
            .sort({ startTime: 1 })
            .limit(3)
            .select("teams startTime _id liveScore matchDesc seriesName status venue")
            .lean() as any;
        }

        return NextResponse.json({ matches: liveMatches });

    } catch (error) {
        console.error("Live Matches API Error (Admin):", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
