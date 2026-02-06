"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, User, Target, Zap, Info, Calendar, MapPin, Users, Activity, Trophy, X, Star, PartyPopper, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface SlotData {
    inningsNumber: number;
    position: number;
    resolution?: {
        playerName: string;
    };
    score?: {
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        isOut: boolean;
    };
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: matchId } = use(params);
    const { data: session } = useSession();
    const [data, setData] = useState<any>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'slots' | 'scorecard' | 'leaderboard' | 'squads' | 'info'>('slots');
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [showWinnerPopup, setShowWinnerPopup] = useState(false);
    const [winnerData, setWinnerData] = useState<any>(null);
    const [hasShownPopup, setHasShownPopup] = useState(false);

    const fetchLeaderboard = async () => {
        try {
            const lbRes = await fetch(`/api/matches/${matchId}/leaderboard`);
            const lbResult = await lbRes.json();
            if (lbRes.ok) setLeaderboard(lbResult);
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
        }
    };

    const fetchMatchData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            // Trigger a background sync for this match specifically to ensure latest batting scores
            // This is non-blocking and silent
            fetch(`/api/sync?matchId=${matchId}`, {
                headers: { 'x-silent-fetch': 'true' }
            }).catch(e => console.error("Auto-sync error", e));

            const res = await fetch(`/api/matches/${matchId}`);
            const result = await res.json();
            if (res.ok) {
                setData(result);
                setLastUpdated(new Date());
                // Also update leaderboard if on that tab or initially (restricted to session)
                if (session && (activeTab === 'leaderboard' || !leaderboard.length)) {
                    fetchLeaderboard();
                }
            } else {
                setError(result.message || "Failed to load match details");
            }
        } catch (err) {
            setError("Connectivity issue. Please try again.");
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMatchData();

        let interval: NodeJS.Timeout;
        if (data?.match?.status === 'live') {
            interval = setInterval(() => fetchMatchData(false), 30000);
        }
        return () => clearInterval(interval);
    }, [matchId, data?.match?.status]);

    // Check for match completion to show winner popup
    useEffect(() => {
        const status = data?.match?.status?.toLowerCase();
        const isFinished = status === 'finished' || status === 'completed' || status === 'result' || status === 'settled';

        if (isFinished && leaderboard.length > 0 && !hasShownPopup) {
            setWinnerData(leaderboard[0]); // Rank 1
            setShowWinnerPopup(true);
            setHasShownPopup(true);
        }
    }, [data?.match?.status, leaderboard, hasShownPopup]);

    if (loading) return (
        <div className="min-h-screen bg-[#050810] flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                    <Trophy className="w-6 h-6 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div className="text-center">
                    <p className="text-white font-black uppercase tracking-[0.2em] text-sm">Synchronizing Assets</p>
                    <p className="text-slate-500 text-xs font-bold mt-1">Fetching live match engine...</p>
                </div>
            </div>
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-[#050810] flex items-center justify-center p-8 text-center">
            <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[3rem] max-w-sm backdrop-blur-xl">
                <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Trophy className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Fixture Not Found</h3>
                <p className="text-slate-500 mb-10 font-medium">This match may have been archived or removed from the active series.</p>
                <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Return Home
                </Link>
            </div>
        </div>
    );

    const { match, slots, advanced } = data;

    // Helper to find score for a specific team from the advanced scorecard
    const getTeamScore = (teamName: string) => {
        if (!advanced?.scorecard) return null;
        const { team1, team2 } = advanced.scorecard;
        // Case-insensitive name matching because Cricbuzz names might differ slightly (e.g., "India" vs "IND")
        if (team1?.name?.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(team1?.name?.toLowerCase())) {
            return team1.score;
        }
        if (team2?.name?.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(team2?.name?.toLowerCase())) {
            return team2.score;
        }
        return null;
    };

    const tabs = [
        { id: 'slots', label: 'My Slots', icon: Target },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
        { id: 'scorecard', label: 'Scorecard', icon: Activity },
        { id: 'squads', label: 'Squads', icon: Users },
        { id: 'info', label: 'Match Info', icon: Info },
    ];

    return (
        <div className="min-h-screen bg-[#050810] text-slate-200">
            {/* Standardized Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-6">
                        <Link href="/dashboard" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                        <div className="flex items-center gap-2 md:gap-3">
                            <Activity className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                            <h1 className="text-lg md:text-xl font-black text-white tracking-tight">MATCH <span className="text-indigo-500">CENTER</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Auto-sync active</span>
                            {lastUpdated && (
                                <span className="text-[8px] font-bold text-slate-500">Synced: {lastUpdated.toLocaleTimeString()}</span>
                            )}
                        </div>
                        <button
                            onClick={() => fetchMatchData(true)}
                            disabled={refreshing}
                            className={`p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all hover:bg-slate-800 group ${refreshing ? 'cursor-not-allowed opacity-50' : ''} shadow-lg`}
                            title="Refresh Match Data"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/5 shadow-inner">
                            <span className={`w-1.5 h-1.5 rounded-full ${match.status === 'live' ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{match.status}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            {/* Hero Section */}
            <div className="pt-24 pb-10 md:pb-12 px-4 border-b border-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="relative mt-4 md:mt-12 bg-[#0A0F1C]/40 border border-white/5 rounded-[2rem] md:rounded-[3.5rem] p-4 sm:p-6 md:p-16 backdrop-blur-2xl overflow-hidden group">
                        {/* Glassy Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-48 md:w-96 h-48 md:h-96 bg-indigo-500/10 blur-[80px] md:blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-48 md:w-96 h-48 md:h-96 bg-purple-500/10 blur-[80px] md:blur-[120px] rounded-full animate-pulse-slow pointer-events-none delay-1000" />

                        <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4 md:gap-12 py-4 md:py-8">
                            {/* Team 1 */}
                            <div className="flex flex-col items-center flex-1 text-center group min-w-0">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-2 border-slate-800 flex items-center justify-center mb-2 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-indigo-500/10">
                                    <span className="text-xl sm:text-3xl md:text-5xl font-black text-white">{match.teams[0].shortName}</span>
                                </div>
                                <h2 className="text-[10px] sm:text-lg md:text-2xl font-black text-white tracking-tight px-1 truncate w-full">{match.teams[0].name}</h2>
                                {getTeamScore(match.teams[0].name) && (
                                    <p className="text-sm sm:text-2xl md:text-3xl font-black text-indigo-400 mt-0.5 md:mt-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-in fade-in zoom-in duration-500">
                                        {getTeamScore(match.teams[0].name)}
                                    </p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="flex flex-col items-center py-2 md:py-0 px-2">
                                <div className="px-3 py-1 md:px-6 md:py-2 bg-slate-900/50 rounded-full border border-slate-800 mb-1 md:mb-4 backdrop-blur-md">
                                    <span className="text-[10px] md:text-sm font-black italic text-slate-600">VS</span>
                                </div>
                                <p className="text-[8px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.1em] md:tracking-widest whitespace-nowrap">{advanced?.info?.date || new Date(match.startTime).toLocaleDateString()}</p>
                            </div>

                            {/* Team 2 */}
                            <div className="flex flex-col items-center flex-1 text-center group min-w-0">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-slate-800 flex items-center justify-center mb-2 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/10">
                                    <span className="text-xl sm:text-3xl md:text-5xl font-black text-white">{match.teams[1].shortName}</span>
                                </div>
                                <h2 className="text-[10px] sm:text-lg md:text-2xl font-black text-white tracking-tight px-1 truncate w-full">{match.teams[1].name}</h2>
                                {getTeamScore(match.teams[1].name) && (
                                    <p className="text-sm sm:text-2xl md:text-3xl font-black text-purple-500 mt-0.5 md:mt-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-in fade-in zoom-in duration-500">
                                        {getTeamScore(match.teams[1].name)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex items-center gap-4 sm:gap-6 md:gap-8 mb-8 md:mb-12 border-b border-white/10 pb-1 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 md:pb-4 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-600'}`} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'slots' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <SectionHeader title="Your Assignments" icon={Target} color="indigo" />
                        {!session ? (
                            <AuthBackdrop message="Personalized assignments are private. Sign in to view your batting slots." />
                        ) : slots.length === 0 ? (
                            <EmptyState message="You haven't been assigned to any slots yet." />
                        ) : (
                            <div className="grid gap-6">
                                {slots.map((slot: SlotData, idx: number) => (
                                    <div key={idx} className="relative overflow-hidden bg-[#0A0F1C]/60 border border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 backdrop-blur-3xl group hover:border-indigo-500/30 transition-all flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between shadow-2xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                                        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto relative z-10">
                                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-indigo-600 flex flex-col items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                                <span className="text-[8px] md:text-[10px] font-black text-indigo-100 uppercase mb-0.5">Pos</span>
                                                <span className="text-lg md:text-2xl font-black text-white leading-none">{slot.position}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg md:text-xl font-black text-white tracking-tight uppercase">Innings {slot.inningsNumber}</h3>
                                                <div className="flex items-center gap-2 mt-1 md:mt-2">
                                                    <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                                        <Activity className="w-2 md:w-2.5 h-2 md:h-2.5 text-indigo-500" />
                                                    </div>
                                                    <span className="text-[8px] md:text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.15em] md:tracking-[0.2em] whitespace-nowrap">
                                                        Playing as {slot.resolution?.playerName || "TBD"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 md:gap-10 items-end md:items-center flex-wrap md:flex-nowrap border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-10 relative z-10 w-full md:w-auto justify-between md:justify-end">
                                            <div className="flex gap-4 sm:gap-6 md:gap-10 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                                                <StatItem label="RUNS" value={slot.score?.runs ?? 0} primary />
                                                <StatItem label="BALLS" value={slot.score?.balls ?? 0} />
                                                <StatItem label="4s" value={slot.score?.fours ?? 0} />
                                                <StatItem label="6s" value={slot.score?.sixes ?? 0} />
                                                <StatItem label="S/R" value={slot.score?.balls ? ((slot.score.runs / slot.score.balls) * 100).toFixed(1) : '0.0'} />
                                            </div>
                                            <div className="flex flex-col items-end shrink-0">
                                                <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase mb-1 md:mb-2 tracking-widest">Status</span>
                                                <span className={`px-3 md:px-4 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${slot.score?.isOut ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                                    {slot.score?.isOut ? 'OUT' : ((slot.score?.balls ?? 0) > 0 ? 'BATTING' : 'DNB')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'leaderboard' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <SectionHeader title="Match Leaderboard" icon={Trophy} color="indigo" />
                        {!session ? (
                            <AuthBackdrop message="The scorecard of champions is for members only. Sign in to view the live leaderboard." />
                        ) : leaderboard.length === 0 ? (
                            <EmptyState message="No scores recorded yet for this match." />
                        ) : (
                            <div className="grid gap-4">
                                {leaderboard.map((entry, idx) => (
                                    <div
                                        key={idx}
                                        className={`relative overflow-hidden bg-[#0A0F1C]/60 border ${idx === 0 ? 'border-yellow-500/30' :
                                            idx === 1 ? 'border-slate-400/30' :
                                                idx === 2 ? 'border-orange-500/30' : 'border-white/5'
                                            } rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 backdrop-blur-3xl group hover:border-indigo-500/30 transition-all`}
                                    >
                                        {/* Rank Badge */}
                                        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
                                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center font-black text-sm md:text-lg ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' :
                                                idx === 1 ? 'bg-slate-400 text-black' :
                                                    idx === 2 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 font-bold'
                                                }`}>
                                                {idx + 1}
                                            </div>

                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1.5px] shadow-lg shadow-indigo-500/20">
                                                    <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden">
                                                        {entry.user.image ? (
                                                            <img src={entry.user.image} alt={entry.user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <User className="w-3 md:w-4 h-3 md:h-4 text-slate-500" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-black tracking-tight uppercase text-xs md:text-sm">{entry.user.name}</span>
                                                    {entry.playingAs && entry.playingAs.length > 0 && (
                                                        <span className="text-[8px] md:text-[9px] font-bold text-indigo-400/70 uppercase tracking-widest mt-0.5">
                                                            AS {entry.playingAs[0].toUpperCase()}
                                                            {entry.playingAs.length > 1 && ` & ${entry.playingAs.length - 1} MORE`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 sm:gap-6 md:gap-10 w-full md:w-auto justify-between md:justify-end px-2 md:px-0 border-t md:border-t-0 border-white/5 pt-3 md:pt-0 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                                            <div className="flex flex-col items-center md:items-end min-w-[30px]">
                                                <span className="text-[8px] md:text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Runs</span>
                                                <span className="text-lg md:text-xl font-black text-white">{entry.totalRuns}</span>
                                            </div>
                                            <div className="flex flex-col items-center md:items-end min-w-[30px]">
                                                <span className="text-[8px] md:text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">Balls</span>
                                                <span className="text-xs md:text-sm font-black text-slate-400">{entry.totalBalls}</span>
                                            </div>
                                            <div className="flex flex-col items-center md:items-end min-w-[20px]">
                                                <span className="text-[8px] md:text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">4s</span>
                                                <span className="text-xs md:text-sm font-black text-slate-400">{entry.totalFours || 0}</span>
                                            </div>
                                            <div className="flex flex-col items-center md:items-end min-w-[20px]">
                                                <span className="text-[8px] md:text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">6s</span>
                                                <span className="text-xs md:text-sm font-black text-slate-400">{entry.totalSixes || 0}</span>
                                            </div>
                                            <div className="flex flex-col items-center md:items-end min-w-[40px]">
                                                <span className="text-[8px] md:text-[9px] font-black text-slate-500 tracking-widest uppercase mb-1">S/R</span>
                                                <span className={`text-xs md:text-sm font-black ${parseFloat(entry.strikeRate) > 150 ? 'text-green-500' : 'text-indigo-400'}`}>
                                                    {entry.strikeRate}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'scorecard' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {advanced?.scorecard ? (
                            <>
                                {advanced.scorecard.team1?.batting?.length > 0 && (
                                    <ScorecardInnings team={advanced.scorecard.team1} isFirst />
                                )}
                                {advanced.scorecard.team2?.batting?.length > 0 && (
                                    <ScorecardInnings team={advanced.scorecard.team2} />
                                )}
                                {(!advanced.scorecard.team1?.batting?.length && !advanced.scorecard.team2?.batting?.length) && (
                                    <EmptyState message="Full scorecard not available yet. The match hasn't started batting." />
                                )}
                            </>
                        ) : (
                            <EmptyState message="Full scorecard not available yet. Synchronizing..." />
                        )}
                    </div>
                )}

                {activeTab === 'squads' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {advanced?.squads ? (
                            <div className="grid md:grid-cols-2 gap-12">
                                <TeamSquad team={advanced.squads.team1} color="indigo" />
                                <TeamSquad team={advanced.squads.team2} color="purple" />
                            </div>
                        ) : (
                            <EmptyState message="Squad details are being fetched..." />
                        )}
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionHeader title="Match Facts" icon={Info} color="slate" />
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
                            {advanced?.info ? (
                                <>
                                    <InfoRow label="Series" value={advanced.info.series} />
                                    <InfoRow label="Match" value={advanced.info.match} />
                                    <InfoRow label="Venue" value={advanced.info.venue} />
                                    <InfoRow label="Toss" value={advanced.info.toss} />
                                    <InfoRow label="Umpires" value={advanced.info.umpires} />
                                    <InfoRow label="Officials" value={advanced.info.matchReferee} />
                                </>
                            ) : (
                                <InfoRow label="Venue" value={match.venue} />
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Winner Popup Overlay */}
            {
                showWinnerPopup && winnerData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
                        <div className="relative w-full max-w-lg bg-[#0A0F1C] border border-white/10 rounded-[3rem] p-10 overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)]">
                            {/* Background Effects */}
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 blur-[80px] rounded-full" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full" />

                            <button
                                onClick={() => setShowWinnerPopup(false)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-yellow-500 via-orange-500 to-yellow-600 p-[3px] shadow-[0_0_40px_rgba(234,179,8,0.3)] mb-8 animate-bounce">
                                    <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center">
                                        <Trophy className="w-12 h-12 text-yellow-500" />
                                    </div>
                                </div>

                                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase mb-2">Match Winner</h2>
                                <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs mb-6 md:mb-8">Performance MVP</p>

                                <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10 w-full p-4 md:p-6 bg-white/5 rounded-[1.5rem] md:rounded-[2rem] border border-white/5">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-[2px]">
                                        <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden">
                                            {winnerData.user.image ? (
                                                <img src={winnerData.user.image} alt={winnerData.user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 md:w-6 h-4 md:h-6 text-slate-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left px-2">
                                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight truncate">{winnerData.user.name}</h3>
                                        <p className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Global Rank Reached: #1</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3 md:gap-4 w-full mb-8 md:mb-10">
                                    <div className="flex flex-col items-center p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Runs</span>
                                        <span className="text-lg md:text-2xl font-black text-white">{winnerData.totalRuns}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Strike Rate</span>
                                        <span className="text-lg md:text-2xl font-black text-indigo-400">{winnerData.strikeRate}</span>
                                    </div>
                                    <div className="flex flex-col items-center p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Boundaries</span>
                                        <span className="text-lg md:text-2xl font-black text-white">{(winnerData.totalFours || 0) + (winnerData.totalSixes || 0)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowWinnerPopup(false)}
                                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <PartyPopper className="w-4 h-4" />
                                    Celebrate Victory
                                </button>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
}

function AuthBackdrop({ message }: { message: string }) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-900/20 border border-white/5 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5 relative z-10">
                <Trophy className="w-8 h-8 text-indigo-500/50" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 max-w-sm px-8 leading-loose relative z-10">
                {message}
            </p>
            <Link href="/login" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20 active:scale-95 relative z-10">
                Sign In to View
            </Link>
        </div>
    );
}

function SectionHeader({ title, icon: Icon, color }: { title: string; icon: any; color: string }) {
    const colorMap: any = {
        blue: 'text-blue-500',
        indigo: 'text-indigo-500',
        slate: 'text-slate-400',
        purple: 'text-purple-500'
    };
    const underlineMap: any = {
        blue: 'decoration-blue-600/30',
        indigo: 'decoration-indigo-500/30',
        purple: 'decoration-purple-500/30'
    };
    return (
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className={`p-2.5 md:p-3 bg-[#0A0F1C] rounded-xl md:rounded-2xl border border-white/5 ${colorMap[color] || colorMap.indigo} shadow-lg shadow-indigo-500/5`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h2 className={`text-xl md:text-3xl font-black text-white tracking-tight underline ${underlineMap[color] || underlineMap.indigo} underline-offset-4 md:underline-offset-8 decoration-2 md:decoration-4 uppercase md:normal-case`}>{title}</h2>
        </div>
    );
}

function StatItem({ label, value, primary = false }: { label: string; value: string | number; primary?: boolean }) {
    return (
        <div className="flex flex-col min-w-[40px]">
            <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase mb-1 md:mb-2 tracking-widest">{label}</span>
            <span className={`text-xl md:text-3xl font-black ${primary ? 'text-indigo-500' : 'text-white'}`}>{value}</span>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800/80 border-dashed rounded-[2.5rem] p-16 text-center">
            <Activity className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-50" />
            <p className="text-slate-500 font-bold max-w-xs mx-auto text-lg leading-snug">{message}</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-center p-6 px-8 hover:bg-slate-800/30 transition-colors">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-white text-right max-w-[60%]">{value}</span>
        </div>
    );
}

function ScorecardInnings({ team, isFirst = false }: { team: any; isFirst?: boolean }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className={`p-6 px-12 flex justify-between items-center border-b border-slate-800 ${isFirst ? 'bg-indigo-600/10' : 'bg-slate-800/20'}`}>
                <h3 className="text-xl font-black text-white">{team.name}</h3>
                <span className="text-2xl font-black text-indigo-500 underline decoration-2 underline-offset-4">{team.score}</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-800">
                            <th className="p-3 md:p-4 px-6 md:px-12 text-left text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[40%]">Batter</th>
                            <th className="p-3 md:p-4 text-left text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[20%]">Status</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">R</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">B</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">4s</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">6s</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {team.batting.map((b: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="p-4 px-12">
                                    <span className="text-sm font-black text-white group-hover:text-indigo-500 transition-colors">{b.name}</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-[10px] font-medium text-slate-500">{b.outStatus}</span>
                                </td>
                                <td className="p-4 text-center font-black text-white">{b.runs}</td>
                                <td className="p-4 text-center text-sm font-bold text-slate-400">{b.balls}</td>
                                <td className="p-4 text-center text-sm font-bold text-slate-400">{b.fours}</td>
                                <td className="p-4 text-center text-sm font-bold text-slate-400">{b.sixes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bowling Stats */}
            <div className="overflow-x-auto border-t border-slate-800/50">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-800">
                            <th className="p-4 px-12 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest w-[50%]">Bowler</th>
                            <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">O</th>
                            <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">M</th>
                            <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">R</th>
                            <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">W</th>
                            <th className="p-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest w-[10%]">ECO</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {team.bowling && team.bowling.map((b: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="p-4 px-12">
                                    <span className="text-sm font-black text-white group-hover:text-indigo-500 transition-colors">{b.name}</span>
                                </td>
                                <td className="p-4 text-center text-sm font-bold text-slate-400">{b.overs}</td>
                                <td className="p-4 text-center text-sm font-bold text-slate-400">{b.maidens}</td>
                                <td className="p-4 text-center text-sm font-black text-white">{b.runs}</td>
                                <td className="p-4 text-center text-sm font-black text-indigo-500">{b.wickets}</td>
                                <td className="p-4 text-center text-sm font-bold text-slate-400">{b.economy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* FOW */}
            {team.fow && team.fow.length > 0 && (
                <div className="bg-slate-950/30 p-6 px-12 border-t border-slate-800/50">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Fall of Wickets</p>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed">{team.fow.join(', ')}</p>
                </div>
            )}
        </div>
    );
}

function TeamSquad({ team, color }: { team: any; color: string }) {
    const glowMap: any = {
        indigo: 'shadow-indigo-600/10',
        purple: 'shadow-purple-600/10'
    };
    return (
        <div className={`flex flex-col gap-6 bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800/80 ${glowMap[color]} shadow-2xl`}>
            <h3 className="text-2xl font-black text-white mb-4 border-l-4 border-indigo-600 pl-4">{team.name}</h3>
            <div className="space-y-4">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[3px]">Playing XI</p>
                <div className="grid gap-3">
                    {team.playingXI.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:bg-slate-900 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-white">{p.name}</span>
                                {p.isCaptain && <span className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-md uppercase">C</span>}
                                {p.isWK && <span className="px-2 py-0.5 bg-slate-700 text-[8px] font-black text-white rounded-md uppercase">WK</span>}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{p.role}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bench */}
            {team.bench && team.bench.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-800/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Bench</p>
                    <div className="grid gap-3">
                        {team.bench.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-slate-950/30 p-4 rounded-2xl border border-slate-800/30 hover:bg-slate-900 transition-colors opacity-75 hover:opacity-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-300">{p.name}</span>
                                    {p.isCaptain && <span className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-md uppercase">C</span>}
                                    {p.isWK && <span className="px-2 py-0.5 bg-slate-700 text-[8px] font-black text-white rounded-md uppercase">WK</span>}
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{p.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
