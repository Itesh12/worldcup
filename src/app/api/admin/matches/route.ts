import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { performMatchSync } from "@/lib/matchSync";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const result = await performMatchSync();

        return NextResponse.json({ 
            message: "Matches synced successfully", 
            count: result.count 
        });
    } catch (error: any) {
        console.error("Match Sync Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const matches = await Match.find().sort({ startTime: -1 });

        return NextResponse.json(matches);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
