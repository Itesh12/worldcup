import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Tournament from "@/models/Tournament";
import Match from "@/models/Match";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SlotScore from "@/models/SlotScore";
import UserMatchStats from "@/models/UserMatchStats";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // 1. Create the default World Cup tournament if it doesn't exist
        let defaultTournament = await Tournament.findOne({ name: "ICC Men's T20 World Cup 2026" });
        if (!defaultTournament) {
            defaultTournament = await Tournament.create({
                name: "ICC Men's T20 World Cup 2026",
                cricbuzzSeriesId: "11253", // Main tournament ID, 11515 was warmups
                cricbuzzSlug: "icc-mens-t20-world-cup-2026",
                isActive: true,
            });
            console.log("Created default tournament:", defaultTournament._id);
        } else {
            console.log("Default tournament already exists:", defaultTournament._id);
        }

        const tId = defaultTournament._id;

        // 2. Update all matches that don't have a tournamentId
        const matchUpdateResult = await Match.updateMany(
            { tournamentId: { $exists: false } },
            { $set: { tournamentId: tId } }
        );
        console.log(`Updated ${matchUpdateResult.modifiedCount} matches`);

        // 3. Update all UserBattingAssignments
        const assignmentUpdateResult = await UserBattingAssignment.updateMany(
            { tournamentId: { $exists: false } },
            { $set: { tournamentId: tId } }
        );
        console.log(`Updated ${assignmentUpdateResult.modifiedCount} assignments`);

        // 4. Update all SlotScores
        const scoreUpdateResult = await SlotScore.updateMany(
            { tournamentId: { $exists: false } },
            { $set: { tournamentId: tId } }
        );
        console.log(`Updated ${scoreUpdateResult.modifiedCount} slot scores`);

        // 5. Update all UserMatchStats
        const statsUpdateResult = await UserMatchStats.updateMany(
            { tournamentId: { $exists: false } },
            { $set: { tournamentId: tId } }
        );
        console.log(`Updated ${statsUpdateResult.modifiedCount} user match stats`);

        return NextResponse.json({
            message: "Migration completed successfully",
            results: {
                tournamentId: tId,
                matchesUpdated: matchUpdateResult.modifiedCount,
                assignmentsUpdated: assignmentUpdateResult.modifiedCount,
                scoresUpdated: scoreUpdateResult.modifiedCount,
                statsUpdated: statsUpdateResult.modifiedCount
            }
        });

    } catch (error: any) {
        console.error("Migration Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
