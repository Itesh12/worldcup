"use client";

import { useEffect, useState, useMemo } from "react";
import { RefreshCcw, Calendar, MapPin, Activity, Swords, Zap, ChevronRight, Globe, Lock, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Match {
    _id: string;
    externalMatchId: string;
    teams: { name: string; shortName: string }[];
    status: string;
    startTime: string;
    venue: string;
}

type TabType = 'today' | 'upcoming' | 'past';

export default function AdminMatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('today');

    useEffect(() => {
        fetchMatches();
    }, []);

    const fetchMatches = async () => {
        try {
            const res = await fetch("/api/admin/matches");
            const data = await res.json();
            if (res.ok) setMatches(data);
        } catch (err) {
            console.error("Failed to fetch matches", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch("/api/admin/matches", { method: "POST" });
            if (res.ok) {
                await fetchMatches();
            }
        } catch (err) {
            console.error("Failed to sync matches", err);
        } finally {
            setSyncing(false);
        }
    };

    // --- Memoized Categorization Logic ---
    const todayStr = useMemo(() => new Date().toDateString(), []);

    const categorizedMatches = useMemo(() => {
        const today = matches.filter(m => {
            const isLive = m.status === 'live' || m.status === 'ongoing';
            const isUpcomingToday = m.status === 'upcoming' && new Date(m.startTime).toDateString() === todayStr;
            return isLive || isUpcomingToday;
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const upcoming = matches.filter(m => {
            const isFuture = m.status === 'upcoming';
            const isNotToday = new Date(m.startTime).toDateString() !== todayStr;
            return isFuture && isNotToday;
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const past = matches.filter(m =>
            m.status === 'finished' || m.status === 'completed' || m.status === 'settled' || m.status === 'result'
        ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        return { today, upcoming, past };
    }, [matches, todayStr]);

    const activeMatches = useMemo(() => {
        return categorizedMatches[activeTab] || [];
    }, [categorizedMatches, activeTab]);

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-20">
            {/* Ambient Background Glows */}
            <div className="absolute -top-40 right-0 w-[800px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Swords className="w-8 h-8 text-indigo-500" />
                        Match Management
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Control fixtures, sync API data, and manage player slot assignments.</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="group relative flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 disabled:opacity-50 active:scale-95 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <RefreshCcw className={`w-5 h-5 ${syncing ? "animate-spin" : ""}`} />
                    <span className="uppercase tracking-widest text-xs">{syncing ? "Synchronizing..." : "Sync World Cup Fixtures"}</span>
                </button>
            </div>

            {/* Tabs Navigation */}
            <div className="relative z-10 flex items-center gap-1 bg-slate-950/40 p-1 rounded-2xl border border-white/5 backdrop-blur-md w-full md:w-fit">
                <button
                    onClick={() => setActiveTab('today')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'today' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Activity className={`w-4 h-4 ${activeTab === 'today' ? 'animate-pulse' : ''}`} />
                    Live & Today
                    {categorizedMatches.today.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{categorizedMatches.today.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'upcoming' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <Clock className="w-4 h-4" />
                    Upcoming
                    {categorizedMatches.upcoming.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{categorizedMatches.upcoming.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('past')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'past' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <CheckCircle className="w-4 h-4" />
                    Past
                    {categorizedMatches.past.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{categorizedMatches.past.length}</span>}
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 relative z-10">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-64 bg-slate-900/40 border border-white/5 rounded-[32px] animate-pulse" />
                    ))}
                </div>
            ) : activeMatches.length === 0 ? (
                <div className="text-center py-32 bg-slate-950/40 border border-dashed border-white/10 rounded-[40px] backdrop-blur-md">
                    <Globe className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-50" />
                    <p className="text-slate-400 text-lg font-medium mb-8">No {activeTab} matches found in this category.</p>
                    <button onClick={handleSync} className="text-indigo-400 font-black flex items-center gap-2 mx-auto hover:text-indigo-300 transition-colors uppercase tracking-widest text-xs">
                        Initiate Global Sync <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 animate-in fade-in duration-500" key={activeTab}>
                    {activeMatches.map((match) => (
                        <div key={match._id} className="group relative overflow-hidden bg-slate-950/40 border border-white/5 rounded-[40px] p-8 hover:border-indigo-500/30 transition-all duration-500 backdrop-blur-xl shadow-2xl">
                            {/* Card Inner Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${match.status === 'live' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                                    match.status === 'upcoming' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                                        'bg-slate-800 border-white/10 text-slate-400'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${match.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-current'}`} />
                                    {match.status}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Lock className="w-3 h-3" /> API REF: {match.externalMatchId}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-10 relative z-10">
                                <div className="text-center flex-1 group-hover:transform group-hover:scale-105 transition-transform duration-500">
                                    <div className="text-4xl font-black text-white tracking-tighter mb-1 uppercase">{match.teams[0]?.shortName ?? "TBC"}</div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{match.teams[0]?.name ?? "TBC"}</div>
                                </div>

                                <div className="flex flex-col items-center px-6">
                                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                                        <Zap className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">VS</span>
                                </div>

                                <div className="text-center flex-1 group-hover:transform group-hover:scale-105 transition-transform duration-500">
                                    <div className="text-4xl font-black text-white tracking-tighter mb-1 uppercase">{match.teams[1]?.shortName ?? "TBC"}</div>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate">{match.teams[1]?.name ?? "TBC"}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8 mb-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Kick Off</span>
                                        <span className="text-xs font-bold text-white/80">{new Date(match.startTime).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex flex-col max-w-[120px]">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Venue</span>
                                        <span className="text-xs font-bold text-white/80 truncate">{match.venue || "TBC"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10">
                                <Link
                                    href={`/admin/matches/${match._id}/slots`}
                                    className="group/btn flex items-center justify-center gap-2 w-full py-4 bg-white/5 hover:bg-indigo-600 text-white rounded-[20px] text-xs font-black transition-all duration-300 border border-white/10 hover:border-indigo-400 uppercase tracking-widest"
                                >
                                    Manage Slots & Assignments
                                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
