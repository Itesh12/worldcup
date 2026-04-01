"use client";

import React from "react";
import { Trophy, Activity, TrendingUp, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface PlayerStats {
    totalRuns: number;
    rank: number;
    netWorth: number;
}

interface PlayerStatsHeaderProps {
    stats: PlayerStats | null;
    loading: boolean;
    tournamentId: string;
}

export function PlayerStatsHeader({ stats, loading, tournamentId }: PlayerStatsHeaderProps) {
    return (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 bg-gradient-to-br from-slate-900 via-[#050B14] to-slate-900 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 group">
                {/* Ambient Glows */}
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.1),transparent_70%)] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full md:w-1/2 h-full bg-[radial-gradient(circle_at_0%_100%,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none" />

                {/* Left Context Info */}
                <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left justify-center flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-inner">
                        <Trophy className="w-3 h-3 text-indigo-400" />
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mt-px">Player Impact Profile</span>
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter italic leading-none mb-2">Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Metrics</span></h3>
                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em]">{tournamentId ? 'Active Context Portfolio' : 'Global Lifetime Statistics'}</p>

                    <Link
                        href="/profile/stats"
                        className="mt-6 hidden lg:inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white hover:text-indigo-300 uppercase tracking-widest transition-all group/btn w-fit"
                    >
                        Deep Analysis
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform text-indigo-400" />
                    </Link>
                </div>

                {/* Transparent Divider (Desktop Only) */}
                <div className="hidden lg:block w-px h-32 bg-gradient-to-b from-transparent via-white/10 to-transparent mx-2" />

                {/* Right Stats Grid */}
                <div className="relative z-10 flex flex-row items-stretch gap-3 sm:gap-4 justify-center w-full lg:w-auto mt-2 lg:mt-0">
                    <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 flex-1 min-w-[100px] sm:min-w-[120px] shadow-inner group-hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Activity className="w-5 h-5 text-indigo-400 mb-3 opacity-80" />
                        <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter leading-none mb-2">{loading ? "---" : (stats?.totalRuns ?? 0)}</span>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Career Runs</span>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 flex-1 min-w-[100px] sm:min-w-[120px] shadow-inner group-hover:border-purple-500/30 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <TrendingUp className="w-5 h-5 text-purple-400 mb-3 opacity-80" />
                        <span className="text-2xl md:text-4xl font-black text-white italic tracking-tighter leading-none mb-2">{loading ? "#--" : `#${stats?.rank ?? "--"}`}</span>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Rank</span>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 md:p-6 flex-1 min-w-[100px] sm:min-w-[120px] shadow-inner group-hover:border-amber-500/30 transition-all duration-500 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Zap className={`w-5 h-5 mb-3 opacity-80 ${stats && stats.netWorth >= 0 ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <span className={`text-2xl md:text-4xl font-black italic tracking-tighter leading-none mb-2 ${stats && stats.netWorth >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{loading ? "₹--" : `₹${stats?.netWorth ?? 0}`}</span>
                        <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">Net Value</span>
                    </div>
                </div>

                {/* Mobile Only Action Button */}
                <Link
                    href="/profile/stats"
                    className="lg:hidden w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all mt-4"
                >
                    Deep Analysis
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </Link>
            </div>
        </section>
    );
}
