import connectDB from "@/lib/db";
import Match from "@/models/Match";
import Tournament from "@/models/Tournament";
import Arena from "@/models/Arena";
import { getCricbuzzMatches } from "@/lib/cricbuzzScraper";
import { revealArenaPositions, finalizeMatchCommissions } from "./revealLogic";

export async function performMatchSync(requestTournamentId?: string) {
    try {
        await connectDB();

        // 1. Determine which tournament to sync
        let targetTournament;
        if (requestTournamentId) {
            targetTournament = await Tournament.findById(requestTournamentId);
        } else {
            targetTournament = await Tournament.findOne({ isActive: true });
        }

        if (!targetTournament) {
            console.log("Match Sync Utility - Target tournament not found.");
            return { success: false, count: 0, message: "Tournament not found" };
        }

        console.log(`Match Sync Utility - Seeking matches from Cricbuzz Scraper for ${targetTournament.name}`);
        const scrapedMatches = await getCricbuzzMatches(targetTournament.cricbuzzSeriesId, targetTournament.cricbuzzSlug);

        if (scrapedMatches.length === 0) {
            console.log("Match Sync Utility - Scraper found 0 matches.");
            return { success: true, count: 0 };
        }

        console.log(`Match Sync Utility - Found ${scrapedMatches.length} matches from Cricbuzz`);
        const matchesToSync = scrapedMatches.map(m => {
            // Defensive: Ensure startTime is a valid Date
            const validStartTime = m.startTime instanceof Date && !isNaN(m.startTime.getTime())
                ? m.startTime
                : new Date();

            return {
                tournamentId: targetTournament._id,
                externalMatchId: m.id,
                teams: [
                    { name: m.team1, shortName: m.team1.substring(0, 3).toUpperCase() },
                    { name: m.team2, shortName: m.team2.substring(0, 3).toUpperCase() }
                ],
                status: m.status,
                startTime: validStartTime,
                venue: m.venue || "N/A",
                matchDesc: m.matchDesc,
                seriesName: m.seriesName
            };
        });

        // Keep track of external IDs for sync consistency
        for (const matchData of matchesToSync) {
            const updatedMatch = await Match.findOneAndUpdate(
                { externalMatchId: matchData.externalMatchId },
                matchData,
                { upsert: true, new: true, runValidators: true }
            );

            if (updatedMatch && ['finished', 'completed', 'result', 'settled', 'abandoned', 'cancelled', 'no result'].includes(updatedMatch.status.toLowerCase())) {
                await finalizeMatchCommissions(updatedMatch._id.toString(), updatedMatch.status);
            }
        }

        console.log(`Match Sync Utility - Successfully synced ${matchesToSync.length} matches (IDs preserved)`);
        
        // 3. Automated 'Blind Draft' T-30 Reveal Logic
        const now = new Date();
        const pendingArenas = await Arena.find({
            isRevealed: false,
            // Matches scheduled to start within 30 mins (or already started)
            revealTime: { $lte: now },
            status: { $ne: 'completed' }
        });

        if (pendingArenas.length > 0) {
            console.log(`Match Sync Utility - Found ${pendingArenas.length} arenas awaiting 'T-30' position reveal.`);
            for (const arena of pendingArenas) {
                try {
                    await revealArenaPositions(arena._id.toString());
                    console.log(`Match Sync Utility - Successfully revealed arena: ${arena.name}`);
                } catch (revealError) {
                    console.error(`Match Sync Utility - Failed to reveal arena ${arena.name}:`, revealError);
                }
            }
        }

        return { success: true, count: matchesToSync.length };
    } catch (error: any) {
        console.error("Match Sync Utility Error:", error);
        throw error;
    }
}
