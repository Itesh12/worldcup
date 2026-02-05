import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Match from "@/models/Match";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import SlotScore from "@/models/SlotScore";
import BattingResolution from "@/models/BattingResolution";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: matchId } = await params;
        const session = await getServerSession(authOptions);

        await connectDB();

        const match = await Match.findById(matchId);
        if (!match) {
            return NextResponse.json({ message: "Match not found" }, { status: 404 });
        }

        // Fetch Advanced real-time data from Cricbuzz
        const { getCricbuzzMatchInfo, getCricbuzzFullScorecard, getCricbuzzMatchSquads } = await import("@/lib/cricbuzzScraper");

        let advancedData = {
            info: null as any,
            scorecard: null as any,
            squads: null as any
        };

        if (match.externalMatchId) {
            const fetchSafe = async (fn: any, id: string) => {
                try { return await fn(id); }
                catch (e) {
                    console.error(`Scraper failure for ${id}:`, e);
                    return null;
                }
            }

            [advancedData.info, advancedData.scorecard, advancedData.squads] = await Promise.all([
                fetchSafe(getCricbuzzMatchInfo, match.externalMatchId),
                fetchSafe(getCricbuzzFullScorecard, match.externalMatchId),
                fetchSafe(getCricbuzzMatchSquads, match.externalMatchId)
            ]);
        }

        // Fetch user's assignments for this match
        let userAssignments = [];
        if (session?.user) {
            userAssignments = await UserBattingAssignment.find({
                matchId,
                userId: (session.user as any).id
            });
        }

        // Fetch slots, resolutions and scores
        const slots = await Promise.all(userAssignments.map(async (asgn) => {
            const resolution = await BattingResolution.findOne({
                matchId,
                inningsNumber: asgn.inningsNumber,
                position: asgn.position
            });

            const score = await SlotScore.findOne({
                matchId,
                inningsNumber: asgn.inningsNumber,
                position: asgn.position
            });

            return {
                inningsNumber: asgn.inningsNumber,
                position: asgn.position,
                resolution,
                score
            };
        }));

        return NextResponse.json({
            match,
            slots,
            advanced: advancedData
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
