import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import UserBattingAssignment from "@/models/UserBattingAssignment";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        // Exhaustive Scan: Find ALL arenas that are completed but still have null positions
        const arenas = await Arena.find({ status: 'completed' });
        let repaired = 0;

        for (const arena of arenas) {
            // Check assignments for this arena
            const assignments = await UserBattingAssignment.find({ arenaId: arena._id });
            const hasTba = assignments.some(a => a.position === null || a.position === undefined);
            
            if (hasTba) {
                console.log(`Global Repair: Fixing arena ${arena.name}`);
                // Move back to 'revealed' but set isRevealed to false.
                // Our new 'Self-Healing' logic in settleArena will catch this 
                // and perform a fresh, accurate settlement.
                arena.status = 'revealed';
                arena.isRevealed = false;
                await arena.save();
                repaired++;
            }
        }

        return NextResponse.json({ 
            message: `Global Repair Complete. Reset ${repaired} arenas. They will now be re-settled accurately via the automated system.`,
            count: repaired 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
