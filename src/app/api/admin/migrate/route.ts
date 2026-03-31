import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Tournament from "@/models/Tournament";
import Match from "@/models/Match";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SlotScore from "@/models/SlotScore";
import UserMatchStats from "@/models/UserMatchStats";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { performMatchSync } from "@/lib/matchSync";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 1. Find all active tournaments
        const activeTournaments = await Tournament.find({ isActive: true });

        if (activeTournaments.length === 0) {
            return NextResponse.json({ message: "No active tournaments found. Please activate at least one tournament first." }, { status: 400 });
        }

        console.log(`Migration - Syncing ${activeTournaments.length} active tournaments.`);
        const syncResults = [];

        // 2. Perform intelligent sync for each active tournament
        for (const t of activeTournaments) {
            const result = await performMatchSync(t._id.toString());
            syncResults.push({ name: t.name, ...result });
        }

        // 3. Intelligent Cleanup for orphaned data (Stats, Scores, Assignments)
        // We link these to the correct tournament by looking up their parent Match
        
        let statsFixed = 0;
        let scoresFixed = 0;
        let assignmentsFixed = 0;

        const orphanedStats = await UserMatchStats.find({ tournamentId: { $exists: false } });
        for (const stat of orphanedStats) {
            const m = await Match.findById(stat.matchId);
            if (m?.tournamentId) {
                await UserMatchStats.findByIdAndUpdate(stat._id, { tournamentId: m.tournamentId });
                statsFixed++;
            }
        }

        const orphanedScores = await SlotScore.find({ tournamentId: { $exists: false } });
        for (const score of orphanedScores) {
            const m = await Match.findById(score.matchId);
            if (m?.tournamentId) {
                await SlotScore.findByIdAndUpdate(score._id, { tournamentId: m.tournamentId });
                scoresFixed++;
            }
        }

        const orphanedAssignments = await UserBattingAssignment.find({ tournamentId: { $exists: false } });
        for (const ass of orphanedAssignments) {
            const m = await Match.findById(ass.matchId);
            if (m?.tournamentId) {
                await UserBattingAssignment.findByIdAndUpdate(ass._id, { tournamentId: m.tournamentId });
                assignmentsFixed++;
            }
        }

        return NextResponse.json({
            message: `Migration completed for ${activeTournaments.length} active tournaments.`,
            syncResults,
            cleanup: {
                statsFixed,
                scoresFixed,
                assignmentsFixed
            }
        });

    } catch (error: any) {
        console.error("Migration Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
