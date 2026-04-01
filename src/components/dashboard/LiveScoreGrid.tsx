"use client";

import React from 'react';
import { Trophy, Clock, Zap, ShieldAlert, Activity, Radio, RefreshCw, ShieldCheck } from 'lucide-react';

interface LiveMatch {
    _id: string;
    seriesName?: string;
    matchDesc?: string;
    teams: { name: string; shortName: string; logo?: string }[];
    liveScore?: {
        team1Score?: string;
        team2Score?: string;
        statusText?: string;
        lastUpdated?: string;
    };
    startTime: string;
    status: string;
    venue?: string;
}

interface LiveScoreGridProps {
    initialMatches?: LiveMatch[];
    role?: 'admin' | 'subadmin';
}

export const LiveScoreGrid: React.FC<LiveScoreGridProps> = ({ initialMatches = [], role = 'admin' }) => {
    const [matches, setMatches] = React.useState<LiveMatch[]>(initialMatches);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [lastRefresh, setLastRefresh] = React.useState<Date>(new Date());

    const fetchMatches = async (isBackground = true) => {
        if (isBackground) setIsSyncing(true);
        try {
            const endpoint = role === 'admin' ? '/api/admin/live-matches' : '/api/subadmin/live-matches';
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setMatches(data.matches || []);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error("Live Score Refresh Failed:", error);
        } finally {
            if (isBackground) {
                setTimeout(() => setIsSyncing(false), 2000); // Visual feedback duration
            }
        }
    };

    React.useEffect(() => {
        // Initial setup if props changed
        if (initialMatches.length > 0 && matches.length === 0) {
            setMatches(initialMatches);
        }

        // 30-second background targeted refresh
        const interval = setInterval(() => {
            fetchMatches(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [role, initialMatches]);

    if (!matches || matches.length === 0) return null;

    const isSingle = matches.length === 1;

    return (
        <div className="relative group/grid select-none">
            <div className={`${isSingle ? "w-full max-w-4xl mx-auto" : "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"} relative pt-8`}>
                {/* Native Dashboard HUD - Integrated standard sync indicator */}
                <div className="absolute top-0 right-0 z-20">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/5 bg-slate-900/60 backdrop-blur-xl transition-all ${isSyncing ? 'border-indigo-500/30 ring-1 ring-indigo-500/20' : ''}`}>
                        <RefreshCw className={`w-2.5 h-2.5 text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-[8px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest tabular-nums">
                            {isSyncing ? 'Syncing...' : lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>

                {matches.map((match) => {
                    const isLive = match.status === 'live';
                    const startTimeStr = new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                        <div 
                            key={match._id} 
                            className="relative overflow-hidden rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 md:p-8 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/20 shadow-2xl transition-all hover:border-indigo-500/40 flex flex-col min-h-0 sm:min-h-[220px]"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                            
                            {/* Dashboard Pattern: Header Section */}
                            <div className="flex justify-between items-center mb-5 sm:mb-6 relative z-10 w-full">
                                <div className="flex items-center gap-2.5 sm:gap-4">
                                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border ${isLive ? 'bg-red-500/10 border-red-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                                        {isLive ? <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-red-500" /> : <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-500" />}
                                    </div>
                                    <div className="flex flex-col gap-0.5 sm:gap-1">
                                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            {match.seriesName || "Arena Global"}
                                        </p>
                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                            <span className="w-1 h-1 bg-indigo-500/40 rounded-full" />
                                            <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                {match.venue || "Global Hub"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border shadow-lg ${isLive ? 'text-red-500 bg-red-500/10 border-red-500/20 animate-pulse' : 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'}`}>
                                    {isLive ? 'LIVE' : 'UPCOMING'}
                                </div>
                            </div>

                            {/* Dashboard Pattern: Central Operational Area */}
                            <div className="flex items-center justify-between flex-1 relative z-10 gap-3 sm:gap-4 my-2">
                                {/* Side A */}
                                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors shadow-inner">
                                        <span className="text-lg sm:text-2xl font-black text-white/80">{match.teams[0]?.shortName[0]}</span>
                                    </div>
                                    <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center truncate w-full">{match.teams[0]?.shortName}</h3>
                                </div>

                                {/* Operational Core (Scores or Time) */}
                                <div className="flex-[1.5] flex flex-col items-center justify-center min-w-0">
                                    {isLive ? (
                                        <div className="text-center flex flex-col items-center gap-2 sm:gap-3 w-full">
                                            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tighter tabular-nums truncate w-full">
                                                {match.liveScore?.team1Score?.split('(')[0] || "0/0"}
                                            </h2>
                                            <div className="h-0.5 sm:h-1 w-10 sm:w-16 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                                <div className="h-full bg-indigo-500/60 animate-shimmer w-full" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1 sm:gap-3 py-2 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-[20px] bg-white/[0.02] border border-white/[0.03] w-full text-center">
                                            <p className="text-[7px] sm:text-[9px] font-black text-indigo-400/50 uppercase tracking-[0.2em] sm:tracking-[0.3em]">KICKOFF</p>
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500/40" />
                                                <span className="text-xl sm:text-3xl font-black text-white tracking-tighter italic">{startTimeStr}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Side B */}
                                <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors shadow-inner">
                                        <span className="text-lg sm:text-2xl font-black text-white/80">{match.teams[1]?.shortName[0]}</span>
                                    </div>
                                    <h3 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest text-center truncate w-full">{match.teams[1]?.shortName}</h3>
                                </div>
                            </div>

                            {/* Dashboard Pattern: Action/Status Footer */}
                            <div className="mt-5 sm:mt-8 pt-4 sm:pt-5 border-t border-white/5 flex items-center justify-between relative z-10 w-full">
                                <div className="flex items-center gap-2.5 sm:gap-3 bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-white/5 max-w-[70%] sm:max-w-none">
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
                                    <p className="text-[8px] sm:text-[10px] font-black text-indigo-400/80 italic tracking-widest uppercase truncate">
                                        {isLive ? (match.liveScore?.statusText || "Active Ops") : "Arena Secured"}
                                    </p>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 opacity-30">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Secured Hub</span>
                                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
