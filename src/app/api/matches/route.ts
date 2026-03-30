import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const tournamentId = searchParams.get('tournamentId');

        await connectDB();
        const filter: any = {};
        if (tournamentId) {
            filter.tournamentId = tournamentId;
        }

        const matches = await Match.find(filter).sort({ startTime: -1 });
        return NextResponse.json(matches);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
