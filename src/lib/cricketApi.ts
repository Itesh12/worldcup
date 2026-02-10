export interface LivePlayerData {
    playerId: string;
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    isOut: boolean;
    position: number; // Actual batting order position
    inningsNumber?: number;
}

export interface LiveMatchData {
    externalMatchId: string;
    status: 'live' | 'finished';
    innings: number;
    batsmen: LivePlayerData[];
}

import { getCricbuzzScorecard } from "./cricbuzzScraper";

export const getLiveMatchData = async (externalMatchId: string): Promise<LiveMatchData | null> => {
    try {
        const scrapedData = await getCricbuzzScorecard(externalMatchId);

        if (!scrapedData) {
            console.log(`Cricbuzz Scraper failed for ${externalMatchId}, falling back to Mock`);
            return getMockLiveData(externalMatchId);
        }

        return {
            externalMatchId,
            status: scrapedData.status as any,
            innings: scrapedData.innings,
            batsmen: scrapedData.batsmen.map(b => ({
                playerId: b.id || `p${b.position}`,
                name: b.name,
                runs: b.runs,
                balls: b.balls,
                fours: b.fours,
                sixes: b.sixes,
                isOut: !!b.outStatus && b.outStatus.toLowerCase() !== 'not out' && b.outStatus !== 'batting',
                position: b.position,
                inningsNumber: (b as any).inningsNumber
            }))
        };
    } catch (error) {
        console.error("Scraper Error:", error);
        return getMockLiveData(externalMatchId);
    }
};

const getMockLiveData = (externalMatchId: string): LiveMatchData | null => {
    if (externalMatchId === 'ext-2') {
        return {
            externalMatchId,
            status: 'live',
            innings: 1,
            batsmen: [
                {
                    playerId: "p1",
                    name: "Quinton de Kock",
                    runs: Math.floor(Math.random() * 50) + 20,
                    balls: 30,
                    fours: 4,
                    sixes: 1,
                    isOut: false,
                    position: 1
                },
                {
                    playerId: "p2",
                    name: "Reeza Hendricks",
                    runs: Math.floor(Math.random() * 30) + 10,
                    balls: 25,
                    fours: 2,
                    sixes: 0,
                    isOut: false,
                    position: 2
                }
            ]
        };
    }
    return null;
};
