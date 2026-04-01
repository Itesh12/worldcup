import Match from "@/models/Match";
import connectDB from "@/lib/db";
import { getCricbuzzFullScorecard } from "./cricbuzzScraper";

/**
 * Focused utility to update scores for matches currently marked as 'live'.
 * Runs quickly to avoid blocking the dashboard.
 */
export async function syncLiveScores() {
    try {
        await connectDB();
        const liveMatches = await Match.find({ status: "live" });
        
        if (liveMatches.length === 0) return;

        console.log(`Score Sync Utility - Updating ${liveMatches.length} live matches.`);

        const updates = liveMatches.map(async (match) => {
            const scorecard = await getCricbuzzFullScorecard(match.externalMatchId);
            if (scorecard) {
                // If match is finished on external but live here, we should update status too
                // But full sync handles status. Score sync is JUST for scores.
                
                match.liveScore = {
                    team1Score: scorecard.team1.score,
                    team2Score: scorecard.team2.score,
                    statusText: scorecard.liveStatus || `${scorecard.team1.name} vs ${scorecard.team2.name}`,
                    lastUpdated: new Date()
                };
                
                await match.save();
            }
        });

        await Promise.all(updates);
    } catch (error) {
        console.error("Score Sync Error:", error);
    }
}
