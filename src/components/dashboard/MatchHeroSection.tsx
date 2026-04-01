"use client";

import React from "react";
import { ArrowRight, Clock, Lock } from "lucide-react";

interface Match {
    _id: string;
    teams: { name: string; shortName: string }[];
    status: string;
    startTime: string;
    venue: string;
}

interface MatchHeroSectionProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
    onHostClick: (match: Match) => void;
}

export function MatchHeroSection({ matches, onMatchClick, onHostClick }: MatchHeroSectionProps) {
    if (matches.length === 0) return null;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                    <span className="w-1.5 h-6 md:w-2 md:h-8 bg-indigo-500 rounded-full" />
                    Live <span className="text-indigo-500">Arena</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase border border-red-500/20 animate-pulse tracking-widest">
                        Live
                    </span>
                </h2>
                <div className="flex gap-2 items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Swipe for more</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                </div>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 scrollbar-hide">
                {matches.map((match) => (
                    <div key={match._id} className="snap-center shrink-0 w-full md:w-[600px]">
                        <HeroMatchCard match={match} onMatchClick={onMatchClick} onHostClick={onHostClick} />
                    </div>
                ))}
            </div>
        </section>
    );
}

function HeroMatchCard({ 
    match, 
    onMatchClick, 
    onHostClick 
}: { 
    match: Match, 
    onMatchClick: (match: Match) => void,
    onHostClick: (match: Match) => void
}) {
    const isLive = match.status === 'live';
    const isFinished = ['finished', 'completed', 'result', 'settled'].includes(match.status);
    const date = new Date(match.startTime);
    
    // Check if match is today
    const isToday = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    const showHostButton = !isFinished && isToday(match.startTime);

    return (
        <div
            onClick={() => onMatchClick(match)}
            className="group relative block w-full h-[200px] xs:h-[240px] md:h-[300px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-indigo-500/10 cursor-pointer"
        >
            <div className="absolute inset-0 bg-[#050B14]" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-purple-600/20 opacity-60 group-hover:opacity-80 transition-opacity" />
            
            {/* Action Area - Responsive Position & Size */}
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-20">
                {showHostButton && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onHostClick(match);
                        }}
                        className="px-3 py-1.5 md:px-5 md:py-2.5 bg-amber-600/10 hover:bg-amber-600 text-amber-500 hover:text-white border border-amber-600/20 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl transition-all shadow-2xl active:scale-95 flex items-center gap-1.5 md:gap-2 group/host backdrop-blur-md"
                    >
                        <Lock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 opacity-50 group-hover/host:opacity-100 transition-opacity" />
                        Host Private
                    </button>
                )}
            </div>

            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

            <div className="relative z-10 h-full flex flex-col items-center justify-between p-6 md:p-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                        {isLive ? (
                            <span className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                                Live
                            </span>
                        ) : isFinished ? (
                            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Finished
                            </span>
                        ) : (
                            <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Upcoming
                            </span>
                        )}
                        <span className="w-px h-3 bg-white/10" />
                        <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{match.venue?.split(',')[0] || 'TBA'}</span>
                    </div>
                </div>

                <div className="w-full flex items-center justify-center gap-4 sm:gap-8 md:gap-16">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                        <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
                            {match.teams[0].shortName}
                        </h3>
                        <p className="text-[7px] xs:text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 md:mt-3 truncate w-full text-center px-1 md:px-2">
                            {match.teams[0].name}
                        </p>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md shadow-2xl relative z-10">
                                <span className="text-slate-400 italic font-black text-[10px] md:text-sm">VS</span>
                            </div>
                        </div>
                        {!isLive && !isFinished && (
                            <span className="mt-3 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[8px] md:text-[9px] font-black rounded-full border border-indigo-500/20 uppercase tracking-widest whitespace-nowrap">
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col items-center flex-1 min-w-0">
                        <h3 className="text-2xl xs:text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
                            {match.teams[1].shortName}
                        </h3>
                        <p className="text-[7px] xs:text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 md:mt-3 truncate w-full text-center px-1 md:px-2">
                            {match.teams[1].name}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                    <span className="text-[8px] md:text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Match Center</span>
                    <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                </div>
            </div>
        </div>
    );
}
