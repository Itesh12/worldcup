import connectDB from "@/lib/db";
import Match from "@/models/Match";
import { getCricbuzzMatches } from "@/lib/cricbuzzScraper";

export async function performMatchSync() {
    try {
        await connectDB();

        console.log("Match Sync Utility - Seeking matches from Cricbuzz Scraper");
        const scrapedMatches = await getCricbuzzMatches();


        let matchesToSync = [];

        if (scrapedMatches.length === 0) {
            console.log("Match Sync Utility - Scraper found 0 matches, using MOCK data");
            matchesToSync = [
                {
                    externalMatchId: "ext-1",
                    teams: [
                        { name: "India", shortName: "IND" },
                        { name: "Australia", shortName: "AUS" }
                    ],
                    status: "upcoming",
                    startTime: new Date(Date.now() + 86400000), // Tomorrow
                    venue: "Narendra Modi Stadium, Ahmedabad"
                },
                {
                    externalMatchId: "ext-2",
                    teams: [
                        { name: "England", shortName: "ENG" },
                        { name: "South Africa", shortName: "RSA" }
                    ],
                    status: "live",
                    startTime: new Date(),
                    venue: "The Lord's, London"
                }
            ];
        } else {
            console.log(`Match Sync Utility - Found ${scrapedMatches.length} matches from Cricbuzz`);
            matchesToSync = scrapedMatches.map(m => {
                // Defensive: Ensure startTime is a valid Date
                let validStartTime = m.startTime instanceof Date && !isNaN(m.startTime.getTime())
                    ? m.startTime
                    : new Date();

                return {
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
        }

        // Keep track of external IDs to delete any matches that are no longer in the series
        const syncedExternalIds = matchesToSync.map(m => m.externalMatchId);

        for (const matchData of matchesToSync) {
            await Match.findOneAndUpdate(
                { externalMatchId: matchData.externalMatchId },
                matchData,
                { upsert: true, new: true, runValidators: true }
            );
        }

        /* 
           Cleanup: Remove matches that are no longer present in the source scraper
           (This replaces the aggressive deleteMany({}) to prevent ID churning)
           
           CRITICAL: Disabling this for now because finished matches (e.g. from yesterday)
           fall out of the scraper's "recent" list, causing them to be deleted along 
           with all associated user slots and stats.
        
           const cleanupResult = await Match.deleteMany({
               externalMatchId: { $nin: syncedExternalIds }
           });

           if (cleanupResult.deletedCount > 0) {
               console.log(`Match Sync Utility - Removed ${cleanupResult.deletedCount} outdated matches`);
           }
        */

        console.log(`Match Sync Utility - Successfully synced ${matchesToSync.length} matches (IDs preserved)`);

        return { success: true, count: matchesToSync.length };
    } catch (error: any) {
        console.error("Match Sync Utility Error:", error);
        throw error;
    }
}
