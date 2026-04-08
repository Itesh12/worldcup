import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import UserBattingAssignment from "@/models/UserBattingAssignment";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        // Find all completed arenas
        const arenas = await Arena.find({ status: 'completed' });
        let repaired = 0;

        for (const arena of arenas) {
            const hasTba = await UserBattingAssignment.findOne({ arenaId: arena._id, position: null });
            
            if (hasTba) {
                // Reset status to allow the hardened cron to fix it
                arena.status = 'revealed';
                arena.isRevealed = false;
                await arena.save();
                repaired++;
            }
        }

        return NextResponse.json({ 
            message: `Reset ${repaired} arenas for repair. The next cron run will fix them automatically.`,
            count: repaired 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
