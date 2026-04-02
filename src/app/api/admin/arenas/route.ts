import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import User from "@/models/User";
import Match from "@/models/Match";
import Tournament from "@/models/Tournament";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const arenas = await Arena.find()
            .populate('matchId')
            .populate('tournamentId')
            .populate({
                path: 'createdBy',
                select: 'name email role'
            })
            .sort({ createdAt: -1 });

        return NextResponse.json(arenas);
    } catch (error: any) {
        console.error("Fetch Admin Global Arenas Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
