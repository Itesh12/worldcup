"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Trophy, ChevronRight, Clock, Activity, Search, MapPin, RefreshCcw, Swords } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserContextSwitcher } from "@/components/UserContextSwitcher";
import { useTournament } from "@/contexts/TournamentContext";
import { AnimatePresence } from "framer-motion";
import ArenaManager from "@/components/shared/ArenaManager";

interface Match {
    _id: string;
    externalMatchId: string;
    teams: { name: string; shortName: string }[];
    status: string;
    startTime: string;
    venue: string;
}

export default function AllMatchesPage() {
    const { data: session } = useSession();
    const { tournamentId } = useTournament();
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'finished'>('upcoming');
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [selectedMatchForHost, setSelectedMatchForHost] = useState<Match | null>(null);

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const url = tournamentId 
                ? `/api/matches?tournamentId=${tournamentId}`
                : `/api/matches`; // Fetch all if global
            const res = await fetch(url);
            const data = await res.json();
            if (res.ok) setMatches(data);
        } catch (err) {
            console.error("Failed to load matches", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await fetch(`/api/matches/sync?tournamentId=${tournamentId}`, {
                method: "POST"
            });
            await fetchMatches();
        } catch (err) {
            console.error("Failed to refresh matches", err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, [tournamentId]);

    const filteredMatches = matches.filter(m => {
        const teamNames = m.teams.map(t => t.name.toLowerCase() + t.shortName.toLowerCase()).join(" ");
        return teamNames.includes(searchQuery.toLowerCase());
    });

    const upcomingMatches = filteredMatches.filter(m => {
        const status = m.status.toLowerCase();
        const isUpcoming = status === 'upcoming' || status === 'live';
        return isUpcoming;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const finishedMatches = filteredMatches.filter(m => {
        const status = m.status.toLowerCase();
        return status === 'finished' || status === 'completed' || status === 'result' || status === 'settled';
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const displayMatches = activeTab === 'upcoming' ? upcomingMatches : finishedMatches;

    return (
        <div className="min-h-screen bg-[#050B14] pb-20 relative overflow-x-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

            <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <Link href="/dashboard" className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <Trophy className="shrink-0 w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                            <h1 className="text-sm md:text-xl font-black text-white tracking-tight truncate">FULL <span className="text-indigo-500">SCHEDULE</span></h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <button
                          onClick={handleRefresh}
                          disabled={refreshing}
                          className={`p-2 md:p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all hover:bg-slate-800 group ${refreshing ? 'cursor-not-allowed opacity-50' : ''} shadow-lg`}
                          title="Refresh Match Data"
                        >
                          <RefreshCcw className={`w-3.5 h-3.5 md:w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-6 border-b border-white/10 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'upcoming' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Upcoming
                            {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('finished')}
                            className={`pb-3 text-xs md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'finished' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Past Results
                            {activeTab === 'finished' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                        </button>
                    </div>

                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Find target teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2.5 md:py-3 pl-11 pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-56 w-full bg-slate-900/30 rounded-3xl animate-pulse border border-white/5" />
                        ))
                    ) : displayMatches.length > 0 ? (
                        displayMatches.map(match => (
                            <StandardMatchCard 
                                key={match._id} 
                                match={match} 
                                onHost={(m) => setSelectedMatchForHost(m)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-30">
                            <Calendar className="w-16 h-16 text-slate-500 mb-4" />
                            <p className="text-white font-bold uppercase tracking-widest">No matches found</p>
                        </div>
                    )}
                </div>
            </main>

            <AnimatePresence>
                {selectedMatchForHost && (
                    <ArenaManager
                        matchId={selectedMatchForHost._id}
                        matchName={`${selectedMatchForHost.teams[0].shortName} VS ${selectedMatchForHost.teams[1].shortName}`}
                        userRole="user"
                        onClose={() => setSelectedMatchForHost(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function StandardMatchCard({ match, onHost }: { match: Match; onHost: (m: Match) => void }) {
    const date = new Date(match.startTime);
    const isFinished = match.status === 'finished' || match.status === 'completed' || match.status === 'result' || match.status === 'settled';
    const isLive = match.status === 'live';

    return (
        <div className="group relative flex flex-col p-6 bg-slate-900/40 border border-white/5 rounded-3xl hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden shadow-lg h-full">
            {/* Make the main area clickable with a Link */}
            <Link href={`/matches/${match._id}`} className="absolute inset-0 z-0" />
            
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            <div className="relative z-10 flex justify-between items-center mb-6 pointer-events-none">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${isLive ? 'bg-red-500/10 border-red-500/20 text-red-500' : isFinished ? 'bg-slate-800 border-white/5 text-slate-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                    {isLive ? (
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live Now
                        </span>
                    ) : isFinished ? 'Completed' : 'Upcoming'}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-3 mb-8 px-1 md:px-2 pointer-events-none">
                {/* Team 1 */}
                <div className="flex-1 flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/40 transition-all shadow-inner">
                        <span className="text-xl md:text-2xl font-black text-white">{match.teams[0]?.shortName || 'TBC'}</span>
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full">{match.teams[0]?.name || 'TBC'}</span>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-[10px] md:text-xs font-black text-slate-700 mb-2">VS</div>
                    <div className="w-px h-8 md:h-10 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
                </div>

                {/* Team 2 */}
                <div className="flex-1 flex flex-col items-center gap-2.5">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/40 transition-all shadow-inner">
                        <span className="text-xl md:text-2xl font-black text-white">{match.teams[1]?.shortName || 'TBC'}</span>
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full">{match.teams[1]?.name || 'TBC'}</span>
                </div>
            </div>

            <div className="relative z-20 mt-auto pt-5 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 text-slate-500 min-w-0">
                        <MapPin className="w-4 h-4 text-slate-600 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wide truncate">
                            {match.venue?.split(',')[0] || 'TBC'}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button 
                        onClick={() => onHost(match)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-slate-800 text-slate-300 rounded-2xl text-[10px] font-black transition-all duration-300 border border-white/10 uppercase tracking-widest relative z-20"
                    >
                        <Swords className="w-3.5 h-3.5" />
                        Host
                    </button>
                    <Link 
                        href={`/matches/${match._id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600/10 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black transition-all duration-300 border border-indigo-500/20 hover:border-indigo-400 uppercase tracking-widest text-center relative z-20"
                    >
                        Match Center
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
