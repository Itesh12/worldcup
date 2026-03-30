import connectDB from "@/lib/db";
import Match from "@/models/Match";
import Tournament from "@/models/Tournament";
import { getCricbuzzMatches } from "@/lib/cricbuzzScraper";

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
                venue: m.venue || "N/A"
            };
        });

        // Keep track of external IDs for sync consistency
        for (const matchData of matchesToSync) {
            await Match.findOneAndUpdate(
                { externalMatchId: matchData.externalMatchId },
                matchData,
                { upsert: true, new: true, runValidators: true }
            );
        }

        console.log(`Match Sync Utility - Successfully synced ${matchesToSync.length} matches (IDs preserved)`);

        return { success: true, count: matchesToSync.length };
    } catch (error: any) {
        console.error("Match Sync Utility Error:", error);
        throw error;
    }
}
