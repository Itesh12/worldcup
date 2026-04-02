import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import Match from "@/models/Match"; // Required for populate
import Tournament from "@/models/Tournament"; // Required for populate
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "subadmin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        const arenas = await Arena.find({ createdBy: (session.user as any).id })
            .populate('matchId')
            .populate('tournamentId')
            .sort({ createdAt: -1 });

        return NextResponse.json(arenas);
    } catch (error: any) {
        console.error("Fetch SubAdmin Arenas Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
