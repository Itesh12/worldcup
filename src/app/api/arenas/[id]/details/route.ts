import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SlotScore from "@/models/SlotScore";
import BattingResolution from "@/models/BattingResolution";
import User from "@/models/User";
import { revealArenaPositions } from "@/lib/revealLogic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: arenaId } = await params;
        await connectDB();

        // 1. Fetch Arena Metadata
        const arena = await Arena.findById(arenaId).populate('createdBy', 'name image');
        if (!arena) {
            return NextResponse.json({ message: "Arena not found" }, { status: 404 });
        }

        // 2. SELF-HEALING: If revealTime has passed but arena is not revealed, reveal it now!
        if (!arena.isRevealed) {
            const now = new Date();
            if (arena.revealTime && new Date(arena.revealTime) <= now) {
                console.log(`Zero-Latency Fail-Safe: Automatically revealing ${arena.name} on view.`);
                await revealArenaPositions(arenaId);
                // Refresh arena metadata after reveal
                const updatedArena = await Arena.findById(arenaId).populate('createdBy', 'name image');
                if (updatedArena) Object.assign(arena, updatedArena.toObject());
            }
        }

        // 3. Fetch all Assignments for this arena (with User details)
        const assignments = await UserBattingAssignment.find({ arenaId }).populate('userId', 'name image');

        // 4. Fetch all Scores for the match associated with this arena
        const scores = await SlotScore.find({ matchId: arena.matchId });

        // 5. Fetch all Resolutions (Cricketer Names) for the match
        const resolutions = await BattingResolution.find({ matchId: arena.matchId });

        // 5. Construct Participant List & Data Map
        const participants = assignments.map((asgn: any) => {
            const user = asgn.userId;
            const score = scores.find(s => s.inningsNumber === asgn.inningsNumber && s.position === asgn.position);
            const resolution = resolutions.find(r => r.inningsNumber === asgn.inningsNumber && r.position === asgn.position);

            return {
                userId: user._id,
                name: user.name,
                image: user.image,
                innings: asgn.inningsNumber,
                position: asgn.position, // Note: Position might be null if not revealed, though assignments usually have them
                playerName: resolution?.playerName || null,
                score: score ? {
                    runs: score.runs || 0,
                    balls: score.balls || 0,
                    fours: score.fours || 0,
                    sixes: score.sixes || 0,
                    isOut: score.isOut || false,
                    strikeRate: score.balls > 0 ? ((score.runs / score.balls) * 100).toFixed(1) : "0.0"
                } : null
            };
        });

        // 6. Calculate Arena-Specific Leaderboard
        // Group by user (in case an arena allows multiple slots per user, though usually it's 1 per innings)
        const userStats: Record<string, any> = {};
        
        participants.forEach(p => {
            const uid = p.userId.toString();
            if (!userStats[uid]) {
                userStats[uid] = {
                    user: { name: p.name, image: p.image, _id: p.userId },
                    totalRuns: 0,
                    totalBalls: 0,
                    totalFours: 0,
                    totalSixes: 0,
                    slots: []
                };
            }
            
            userStats[uid].slots.push({
                innings: p.innings,
                position: p.position,
                playerName: p.playerName,
                score: p.score
            });

            if (p.score) {
                userStats[uid].totalRuns += p.score.runs;
                userStats[uid].totalBalls += p.score.balls;
                userStats[uid].totalFours += p.score.fours;
                userStats[uid].totalSixes += p.score.sixes;
            }
        });

        const leaderboard = Object.values(userStats).sort((a: any, b: any) => {
            // Primary: Runs (Desc)
            if (b.totalRuns !== a.totalRuns) return b.totalRuns - a.totalRuns;

            // Secondary: Strike Rate (Desc)
            const srA = a.totalBalls > 0 ? (a.totalRuns / a.totalBalls) * 100 : 0;
            const srB = b.totalBalls > 0 ? (b.totalRuns / b.totalBalls) * 100 : 0;
            if (srB !== srA) return srB - srA;

            // Tertiary: Boundaries (Desc)
            const boundA = (a.totalFours || 0) + (a.totalSixes || 0);
            const boundB = (b.totalFours || 0) + (b.totalSixes || 0);
            return boundB - boundA;
        }).map((entry: any, index: number) => ({
            rank: index + 1,
            ...entry,
            strikeRate: entry.totalBalls > 0 ? (entry.totalRuns / entry.totalBalls * 100).toFixed(1) : "0.0"
        }));

        return NextResponse.json({
            arena: {
                name: arena.name,
                status: arena.status,
                entryFee: arena.entryFee,
                isRevealed: arena.isRevealed,
                isPrivate: arena.isPrivate,
                inviteCode: arena.inviteCode
            },
            participants,
            leaderboard
        });

    } catch (error: any) {
        console.error("Arena Details API Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
