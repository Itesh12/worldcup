import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const matches = await Match.find().sort({ startTime: -1 });
        return NextResponse.json(matches);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
