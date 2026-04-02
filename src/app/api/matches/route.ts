import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tournamentId = searchParams.get('tournamentId');
        const today = searchParams.get('today');

        await connectDB();
        const filter: any = {};
        if (tournamentId) {
            filter.tournamentId = tournamentId;
        }

        if (today === 'true') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);
            filter.startTime = { $gte: startOfDay, $lte: endOfDay };
        }

        const matches = await Match.find(filter).sort({ startTime: -1 });
        return NextResponse.json(matches);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
