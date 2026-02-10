import * as cheerio from 'cheerio';

export interface ScrapedBatsman {
    name: string;
    id: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    outStatus: string;
}

export interface ScrapedMatch {
    id: string;
    title: string;
    team1: string;
    team2: string;
    status: 'live' | 'upcoming' | 'finished';
    startTime?: Date;
    venue?: string;
}

export interface MatchInfo {
    series: string;
    match: string;
    date: string;
    venue: string;
    toss?: string;
    umpires?: string;
    thirdUmpire?: string;
    matchReferee?: string;
}

export interface BattingEntry {
    name: string;
    id: string;
    outStatus: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    sr: string;
}

export interface BowlingEntry {
    name: string;
    id: string;
    overs: string;
    maidens: number;
    runs: number;
    wickets: number;
    noBalls: number;
    wides: number;
    economy: string;
}

export interface FullScorecard {
    team1: {
        name: string;
        score: string;
        batting: BattingEntry[];
        bowling: BowlingEntry[];
        fow: string[];
    };
    team2: {
        name: string;
        score: string;
        batting: BattingEntry[];
        bowling: BowlingEntry[];
        fow: string[];
    };
}

export interface SquadPlayer {
    name: string;
    id: string;
    role: string;
    isCaptain?: boolean;
    isWK?: boolean;
}

export interface MatchSquads {
    team1: {
        name: string;
        playingXI: SquadPlayer[];
        bench: SquadPlayer[];
    };
    team2: {
        name: string;
        playingXI: SquadPlayer[];
        bench: SquadPlayer[];
    };
}

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const fetchWithRetry = async (url: string, options: RequestInit = {}, retries = 3): Promise<Response> => {
    try {
        const headers = {
            'User-Agent': USER_AGENT,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            ...options.headers
        };

        const response = await fetch(url, { ...options, headers });
        if (!response.ok && response.status >= 500) {
            throw new Error(`Status ${response.status}`);
        }
        return response;
    } catch (error: any) {
        if (retries > 0 && (error.cause?.code === 'ECONNRESET' || error.message.includes('fetch failed'))) {
            console.warn(`Fetch failed for ${url}, retrying (${retries} left)...`);
            await new Promise(r => setTimeout(r, 2000 * (4 - retries)));
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
};

export const getCricbuzzMatches = async (): Promise<ScrapedMatch[]> => {
    const seriesIds = ['11515', '11253']; // 11515: Warm-ups, 11253: Main Tournament
    const seriesSlugMap: Record<string, string> = {
        '11515': 'icc-mens-t20-world-cup-warm-up-matches-2026',
        '11253': 'icc-mens-t20-world-cup-2026'
    };
    const allMatches: ScrapedMatch[] = [];

    for (const seriesId of seriesIds) {
        try {
            const slug = seriesSlugMap[seriesId];
            const seriesUrl = `https://www.cricbuzz.com/cricket-series/${seriesId}/${slug}/matches`;
            console.log(`Scraping series ${seriesId}: ${seriesUrl}`);
            const response = await fetchWithRetry(seriesUrl, {
                cache: 'no-store'
            });
            const html = await response.text();

            const chunks = html.split(/\\?"matchInfo\\?":/);

            for (let i = 1; i < chunks.length; i++) {
                const chunk = chunks[i];
                const searchWindow = chunk.substring(0, 3000);

                const idMatch = searchWindow.match(/\\?"matchId\\?":\s*(\d+)/);
                const seriesIdMatch = searchWindow.match(/\\?"seriesId\\?":\s*(\d+)/);

                const id = idMatch ? idMatch[1] : null;
                const chunkSeriesId = seriesIdMatch ? seriesIdMatch[1] : null;

                if (!id || chunkSeriesId !== seriesId) continue;
                if (allMatches.find(m => m.id === id)) continue;

                const numericDateMatch = searchWindow.match(/\\?"startDate\\?":\s*(\d+)(?!")/);
                const stringDateMatch = searchWindow.match(/\\?"startDate\\?":\s*\\?"([^"]+)\\?"/);

                let startDate = new Date();
                if (numericDateMatch) {
                    startDate = new Date(parseInt(numericDateMatch[1]));
                } else if (stringDateMatch) {
                    const dateVal = stringDateMatch[1].replace(/\\/g, '');
                    if (/^\d+$/.test(dateVal)) {
                        startDate = new Date(parseInt(dateVal));
                    } else {
                        startDate = new Date(dateVal);
                    }
                }

                const descMatch = searchWindow.match(/\\?"matchDesc\\?":\s*\\?"([^"]+)\\?"/);
                const matchDesc = descMatch ? descMatch[1] : '';

                const team1Match = searchWindow.match(/\\?"team1\\?":\s*\{.*?\\?"teamName\\?":\s*\\?"([^"]+)\\?"/);
                const team2Match = searchWindow.match(/\\?"team2\\?":\s*\{.*?\\?"teamName\\?":\s*\\?"([^"]+)\\?"/);
                const team1 = team1Match ? team1Match[1].replace(/\\/g, '') : 'TBC';
                const team2 = team2Match ? team2Match[1].replace(/\\/g, '') : 'TBC';

                const statusMatch = searchWindow.match(/\\?"status\\?":\s*\\?"([^"]+)\\?"/);
                const statusText = statusMatch ? statusMatch[1] : '';

                const isFinished = statusText.toLowerCase().includes('won') ||
                    statusText.toLowerCase().includes('result') ||
                    statusText.toLowerCase().includes('tied') ||
                    statusText.toLowerCase().includes('abandoned') ||
                    statusText.toLowerCase().includes('no result');

                const isLive = statusText.toLowerCase().includes('live') ||
                    statusText.toLowerCase().includes('progress') ||
                    statusText.toLowerCase().includes('opt ') ||
                    statusText.toLowerCase().includes('toss') ||
                    statusText.toLowerCase().includes('trail by') ||
                    statusText.toLowerCase().includes('lead by') ||
                    statusText.toLowerCase().includes('need') ||
                    statusText.toLowerCase().includes('break') ||
                    statusText.toLowerCase().includes('delayed') ||
                    /\d+\/\d+/.test(statusText) ||
                    /\d+\s*ov\)/i.test(statusText);

                const status: ScrapedMatch['status'] = isFinished ? 'finished' : (isLive ? 'live' : 'upcoming');
                const title = `${team1} vs ${team2}, ${matchDesc}`;

                allMatches.push({
                    id,
                    title,
                    team1,
                    team2,
                    status,
                    venue: seriesId === '11515' ? 'ICC Men\'s T20 World Cup Warm-up' : 'ICC Men\'s T20 World Cup 2026',
                    startTime: startDate
                });
            }

        } catch (error) {
            console.error(`Cricbuzz Series Scraper Error for ${seriesId}:`, error);
        }
    }

    console.log(`Cricbuzz Series Scraper - Total Count: ${allMatches.length}`);
    return allMatches;
};

export const getCricbuzzMatchInfo = async (matchId: string): Promise<MatchInfo | null> => {
    try {
        const response = await fetchWithRetry(`https://www.cricbuzz.com/cricket-match-facts/${matchId}/match`);
        const html = await response.text();
        const $ = cheerio.load(html);
        const info: Partial<MatchInfo> = {};

        $('.grid.facts-row-grid').each((_, el) => {
            const label = $(el).children().eq(0).text().trim();
            const value = $(el).children().eq(1).text().trim();
            if (label.includes('Match')) info.match = value;
            if (label.includes('Series')) info.series = value;
            if (label.includes('Date')) info.date = value;
            if (label.includes('Venue')) info.venue = value;
            if (label.includes('Toss')) info.toss = value;
            if (label.includes('Umpires')) info.umpires = value;
            if (label.includes('Third Umpire')) info.thirdUmpire = value;
            if (label.includes('Match Referee')) info.matchReferee = value;
        });

        if (!info.match) {
            $('.cb-col-100.cb-col-rt').each((_, el) => {
                const text = $(el).text();
                if (text.includes('Match:')) info.match = text.replace('Match:', '').trim();
                if (text.includes('Series:')) info.series = text.replace('Series:', '').trim();
                if (text.includes('Date:')) info.date = text.replace('Date:', '').trim();
                if (text.includes('Venue:')) info.venue = text.replace('Venue:', '').trim();
            });
        }
        return info as MatchInfo;
    } catch (error) {
        console.error("Cricbuzz Scraper Error (MatchInfo):", error);
        return null;
    }
};

export const getCricbuzzFullScorecard = async (matchId: string): Promise<FullScorecard | null> => {
    try {
        const response = await fetchWithRetry(`https://www.cricbuzz.com/live-cricket-scorecard/${matchId}/match`, {
            cache: 'no-store'
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const innings: any[] = [];

        $('div[id^="scard-team-"]').each((_, container) => {
            const $container = $(container);
            const id = $container.attr('id') || '';

            const headerId = id.replace('scard-', '');
            const $header = $(`#${headerId}`).length ? $(`#${headerId}`) : $container.prev();

            const $headerLongName = $header.find('[class*="tb:block"]').first();
            const $headerShortName = $header.find('[class*="tb:hidden"]').first();

            let teamNameRaw = "";
            if ($headerLongName.length) {
                teamNameRaw = $headerLongName.text().trim();
            } else if ($headerShortName.length) {
                teamNameRaw = $headerShortName.text().trim();
            } else {
                const fullText = $header.text().trim();
                teamNameRaw = fullText.split(/[\d-]/)[0].trim();
            }

            const teamName = teamNameRaw || `Team ${innings.length + 1}`;

            const teamInfo = $header.text().trim();
            const scoreMatch = teamInfo.match(/\d+-\d+\s\(\d+(\.\d+)?\sOv\)/) || teamInfo.match(/\d+-\d+/);
            const score = scoreMatch ? scoreMatch[0] : "";

            const batting: BattingEntry[] = [];
            const bowling: BowlingEntry[] = [];
            const fow: string[] = [];

            $container.find('.scorecard-bat-grid, .cb-scrd-itms').each((_, row) => {
                const $row = $(row);
                const nameEl = $row.find('a[href*="/profiles/"]');
                if (!nameEl.length || $row.text().includes('Total') || $row.text().includes('Extras')) return;

                const cells = $row.children();
                const fullNameText = $(cells[0]).text().trim();
                const playerName = nameEl.text().trim();

                if (cells.length >= 6) {
                    batting.push({
                        name: playerName,
                        id: nameEl.attr('href')?.split('/')[2] || '',
                        outStatus: fullNameText.replace(playerName, '').trim() || "not out",
                        runs: parseInt($(cells[1]).text()) || 0,
                        balls: parseInt($(cells[2]).text()) || 0,
                        fours: parseInt($(cells[3]).text()) || 0,
                        sixes: parseInt($(cells[4]).text()) || 0,
                        sr: $(cells[5]).text().trim()
                    });
                }
            });

            $container.find('.scorecard-bowl-grid').each((_, row) => {
                const $row = $(row);
                const nameEl = $row.find('a[href*="/profiles/"]');
                if (!nameEl.length) return;

                const cells = $row.children();
                if (cells.length >= 8) {
                    bowling.push({
                        name: nameEl.text().trim(),
                        id: nameEl.attr('href')?.split('/')[2] || '',
                        overs: $(cells[1]).text().trim(),
                        maidens: parseInt($(cells[2]).text()) || 0,
                        runs: parseInt($(cells[3]).text()) || 0,
                        wickets: parseInt($(cells[4]).text()) || 0,
                        noBalls: parseInt($(cells[5]).text()) || 0,
                        wides: parseInt($(cells[6]).text()) || 0,
                        economy: $(cells[7]).text().trim()
                    });
                }
            });

            $container.find('.scorecard-fow-grid').each((_, row) => {
                const text = $(row).text().trim();
                const lowerText = text.toLowerCase();
                if (text && !lowerText.includes('fall of wickets')) {
                    fow.push(text);
                }
            });

            innings.push({ name: teamName, score, batting, bowling, fow });
        });

        const uniqueInningsMap = new Map();
        innings.forEach(inn => {
            const existing = uniqueInningsMap.get(inn.name);
            if (!existing || inn.batting.length > existing.batting.length) {
                uniqueInningsMap.set(inn.name, inn);
            }
        });

        const finalInnings = Array.from(uniqueInningsMap.values());
        const innings1 = finalInnings[0] || { name: 'Innings 1', score: '', batting: [], bowling: [], fow: [] };
        const innings2 = finalInnings[1] || { name: 'Innings 2', score: '', batting: [], bowling: [], fow: [] };

        return { team1: innings1, team2: innings2 };
    } catch (error) {
        console.error("Cricbuzz Scraper Error (FullScorecard):", error);
        return null;
    }
};

export const getCricbuzzMatchSquads = async (matchId: string): Promise<MatchSquads | null> => {
    try {
        const response = await fetchWithRetry(`https://www.cricbuzz.com/cricket-match-squads/${matchId}/match`);
        const html = await response.text();
        const $ = cheerio.load(html);

        const team1: SquadPlayer[] = [];
        const team1Bench: SquadPlayer[] = [];
        const team2: SquadPlayer[] = [];
        const team2Bench: SquadPlayer[] = [];

        const teamNames = $('.cb-nav-sub-header').text().split(',')[0].split(' vs ');
        const team1Name = teamNames[0]?.trim() || "Team 1";
        const team2Name = teamNames[1]?.trim() || "Team 2";

        let section: 'playing' | 'bench' | null = null;

        $('*').each((_, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            const lowerText = text.toLowerCase();

            if (lowerText.includes('playing xi')) {
                section = 'playing';
                return;
            }
            if (lowerText.includes('bench')) {
                section = 'bench';
                return;
            }

            if ($el.is('a') && $el.attr('href')?.includes('/profiles/')) {
                const id = $el.attr('href')?.split('/')[2] || '';
                const fullLinkText = $el.text().trim();
                const nameText = $el.find('span').first().text().trim() || fullLinkText.split('\n')[0];
                const roleText = $el.find('.text-cbTxtSec').first().text().trim() || $el.find('div.text-xs').first().text().trim();

                if (!nameText || !id || !section) return;

                const player = {
                    name: nameText.replace(/\(c\)/i, '').replace(/\(wk\)/i, '').replace(/\s+/g, ' ').trim(),
                    id,
                    role: roleText.replace(nameText, '').trim(),
                    isCaptain: fullLinkText.toLowerCase().includes('(c)'),
                    isWK: fullLinkText.toLowerCase().includes('(wk)') || roleText.toLowerCase().includes('wk')
                };

                const isSecondCol = $el.parent().hasClass('w-1/2') && $el.parent().prev().hasClass('w-1/2');
                const pIdx = isSecondCol ? 2 : 1;

                if (pIdx === 1) {
                    if (section === 'playing') {
                        if (!team1.find(p => p.id === id)) team1.push(player);
                    } else {
                        if (!team1Bench.find(p => p.id === id)) team1Bench.push(player);
                    }
                } else {
                    if (section === 'playing') {
                        if (!team2.find(p => p.id === id)) team2.push(player);
                    } else {
                        if (!team2Bench.find(p => p.id === id)) team2Bench.push(player);
                    }
                }
            }
        });

        const enforceBenchSplit = (playing: SquadPlayer[], bench: SquadPlayer[]) => {
            if (bench.length === 0 && playing.length > 11) {
                const excess = playing.splice(11);
                bench.push(...excess);
            }
        };

        enforceBenchSplit(team1, team1Bench);
        enforceBenchSplit(team2, team2Bench);

        return {
            team1: { name: team1Name, playingXI: team1, bench: team1Bench },
            team2: { name: team2Name, playingXI: team2, bench: team2Bench }
        };
    } catch (error) {
        console.error("Cricbuzz Scraper Error (Squads):", error);
        return null;
    }
};

export const getCricbuzzScorecard = async (matchId: string) => {
    try {
        const full = await getCricbuzzFullScorecard(matchId);
        if (!full) return null;

        const team2Batting = full.team2.batting.length > 0;
        const currentInnings = team2Batting ? 2 : 1;

        const allBatsmen = [];

        if (full.team1.batting.length > 0) {
            allBatsmen.push(...full.team1.batting.map((b, idx) => ({
                id: b.id,
                name: b.name,
                runs: b.runs,
                balls: b.balls,
                fours: b.fours,
                sixes: b.sixes,
                outStatus: b.outStatus,
                position: idx + 1,
                inningsNumber: 1
            })));
        }

        if (full.team2.batting.length > 0) {
            allBatsmen.push(...full.team2.batting.map((b, idx) => ({
                id: b.id,
                name: b.name,
                runs: b.runs,
                balls: b.balls,
                fours: b.fours,
                sixes: b.sixes,
                outStatus: b.outStatus,
                position: idx + 1,
                inningsNumber: 2
            })));
        }

        return {
            status: 'live',
            innings: currentInnings,
            batsmen: allBatsmen
        };
    } catch (error) {
        console.error("getCricbuzzScorecard Error:", error);
        return null;
    }
};
