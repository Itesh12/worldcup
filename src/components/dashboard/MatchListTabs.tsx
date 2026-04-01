"use client";

import React, { useState } from "react";
import { Calendar, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

interface Match {
    _id: string;
    teams: { name: string; shortName: string }[];
    status: string;
    startTime: string;
    venue: string;
}

interface MatchListTabsProps {
    upcomingMatches: Match[];
    finishedMatches: Match[];
    onMatchClick: (match: Match) => void;
}

export function MatchListTabs({ upcomingMatches, finishedMatches, onMatchClick }: MatchListTabsProps) {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'finished'>('upcoming');

    return (
        <div className="lg:col-span-8">
            <div className="flex items-center gap-8 mb-8 border-b border-white/5 pb-1 overflow-x-auto scrollbar-hide">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === 'upcoming' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
                >
                    Upcoming
                    {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                </button>
                <button
                    onClick={() => setActiveTab('finished')}
                    className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === 'finished' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
                >
                    Past Results
                    {activeTab === 'finished' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                </button>
            </div>

            <div className="flex lg:grid overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none lg:grid-cols-2 gap-6 mb-8 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {activeTab === 'upcoming' ? (
                    upcomingMatches.length > 0 ? (
                        upcomingMatches.map(match => (
                            <div key={match._id} className="min-w-[85vw] md:min-w-[45vw] lg:min-w-0 snap-center shrink-0 lg:shrink">
                                <StandardMatchCard match={match} onMatchClick={onMatchClick} />
                            </div>
                        ))
                    ) : (
                        <div className="w-full lg:col-span-2">
                             <EmptyState message="No upcoming matches scheduled." />
                        </div>
                    )
                ) : (
                    finishedMatches.length > 0 ? (
                        finishedMatches.map(match => (
                            <div key={match._id} className="min-w-[85vw] md:min-w-[45vw] lg:min-w-0 snap-center shrink-0 lg:shrink">
                                <StandardMatchCard match={match} onMatchClick={onMatchClick} />
                            </div>
                        ))
                    ) : (
                        <div className="w-full lg:col-span-2">
                            <EmptyState message="No completed matches yet." />
                        </div>
                    )
                )}
            </div>

            <Link
                href="/matches"
                className="group flex items-center justify-center gap-3 w-full py-5 rounded-3xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all text-xs font-black text-slate-400 hover:text-white uppercase tracking-[0.2em]"
            >
                <Calendar className="w-4 h-4 text-indigo-500" />
                {activeTab === 'upcoming' ? "Tournament Schedule" : "All Match Results"}
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
        </div>
    );
}

function StandardMatchCard({ match, onMatchClick }: { match: Match, onMatchClick: (match: Match) => void }) {
    const date = new Date(match.startTime);
    const isFinished = ['finished', 'completed', 'result', 'settled'].includes(match.status);
    const isLive = match.status === 'live';

    return (
        <div
            onClick={() => onMatchClick(match)}
            className="group relative flex flex-col p-5 bg-slate-900/40 border border-white/5 rounded-3xl hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden shadow-lg h-full cursor-pointer"
        >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            <div className="flex justify-between items-center mb-6">
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${isLive ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    isFinished ? 'bg-slate-800 border-white/5 text-slate-500' :
                        'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                    {isLive ? (
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live
                        </span>
                    ) : isFinished ? 'Completed' : 'Upcoming'}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            <div className="flex items-center justify-between gap-2 mb-6 px-1 md:px-2">
                <div className="flex-1 flex flex-col items-center gap-1.5 md:gap-2">
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors shadow-inner">
                        <span className="text-sm md:text-xl font-black text-white">{match.teams[0].shortName}</span>
                    </div>
                    <span className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full px-1">{match.teams[0].name}</span>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-[9px] md:text-[10px] font-black text-slate-600 mb-1">VS</div>
                    <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
                </div>

                <div className="flex-1 flex flex-col items-center gap-1.5 md:gap-2">
                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors shadow-inner">
                        <span className="text-sm md:text-xl font-black text-white">{match.teams[1].shortName}</span>
                    </div>
                    <span className="text-[7px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full px-1">{match.teams[1].name}</span>
                </div>
            </div>

            <div className="mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
                    <div className="w-1 h-1 rounded-full bg-slate-700 group-hover:bg-indigo-500" />
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest truncate">{match.venue || "TBA"}</span>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-20 text-center bg-slate-900/20 rounded-[2rem] border border-white/5 border-dashed">
            <Calendar className="w-10 h-10 text-slate-800 mx-auto mb-4 opacity-20" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">{message}</p>
        </div>
    );
}
