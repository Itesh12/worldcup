import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Tournament from "@/models/Tournament";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        // Fetch all active or visible tournaments for users. 
        // For now, we fetch all to allow users to see past stats, sorted by active first, then date.
        const tournaments = await Tournament.find().sort({ isActive: -1, createdAt: -1 });
        return NextResponse.json(tournaments);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
