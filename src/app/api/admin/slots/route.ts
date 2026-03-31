import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import BattingSlot from "@/models/BattingSlot";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { matchId, slotCount = 8 } = await req.json();
        
        if (!matchId) {
            return NextResponse.json({ message: "MatchID required" }, { status: 400 });
        }

        // Validate slotCount: even number between 2 and 10
        if (slotCount < 2 || slotCount > 10 || slotCount % 2 !== 0) {
            return NextResponse.json({ message: "Invalid slot count. Must be an even number between 2 and 10." }, { status: 400 });
        }

        await connectDB();

        // Calculate slots per innings (Must be even total)
        const slotsPerInnings = slotCount / 2;

        const slots = [];
        for (const innings of [1, 2]) {
            for (const pos of Array.from({ length: slotsPerInnings }, (_, i) => i + 1)) {
                slots.push({
                    matchId,
                    inningsNumber: innings,
                    position: pos
                });
            }
        }

        // Use bulkWrite for efficiency and to avoid duplicates if rerun
        const ops = slots.map(slot => ({
            updateOne: {
                filter: { matchId: slot.matchId, inningsNumber: slot.inningsNumber, position: slot.position },
                update: slot,
                upsert: true
            }
        }));

        await BattingSlot.deleteMany({ matchId });
        await BattingSlot.bulkWrite(ops);

        return NextResponse.json({ message: "Slots generated successfully" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ message: "MatchID required" }, { status: 400 });
        }

        await connectDB();
        const slots = await BattingSlot.find({ matchId }).sort({ inningsNumber: 1, position: 1 });

        return NextResponse.json(slots);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
