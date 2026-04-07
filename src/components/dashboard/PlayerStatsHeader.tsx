"use client";

import React from "react";
import { Trophy, Activity, TrendingUp, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

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
    const totalRuns = stats?.totalRuns ?? 0;
    
    // Milestone Logic: Progress toward next rank
    const nextMilestone = totalRuns < 500 ? 500 : 
                         totalRuns < 1500 ? 1500 : 
                         totalRuns < 5000 ? 5000 : 10000;
    const progress = Math.min((totalRuns / nextMilestone) * 100, 100);
    const rankName = totalRuns < 500 ? 'Rookie' :
                     totalRuns < 1500 ? 'Veteran' :
                     totalRuns < 5000 ? 'Elite' : 'Legend';

    return (
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative overflow-hidden rounded-[2.5rem] p-6 md:p-10 bg-gradient-to-br from-[#0A0F1C] via-[#050B14] to-[#0A0F1C] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 flex flex-col lg:flex-row items-center justify-between gap-10 group">
                
                {/* Ambient Glows */}
                <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-[radial-gradient(circle_at_100%_0%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
                
                {/* Left: Career Context & Milestone */}
                <div className="relative z-10 flex flex-col items-center lg:items-start text-center lg:text-left justify-center flex-1 max-w-xl">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6 shadow-xl">
                        <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Gladiator Career Summary</span>
                    </div>
                    
                    <h3 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter italic leading-[1.1] mb-3">
                        SESSION <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">MASTERY</span>
                    </h3>
                    
                    <p className="text-slate-500 text-[11px] md:text-sm font-bold uppercase tracking-[0.3em] mb-8">
                        {tournamentId ? 'Active Tournament Context' : 'Global Lifetime Performance'}
                    </p>

                    {/* Milestone Progress Tracker */}
                    <div className="w-full bg-white/5 rounded-3xl p-6 border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden group/milestone">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent opacity-0 group-hover/milestone:opacity-100 transition-opacity" />
                        
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Zap className="w-3.5 h-3.5 text-indigo-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-left">Career Class</span>
                                    <span className="text-sm font-black text-white uppercase italic leading-none text-left">{rankName}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">To Next Rank</span>
                                <span className="text-xs font-black text-indigo-400 tabular-nums italic">{(nextMilestone - totalRuns).toLocaleString()} Runs</span>
                            </div>
                        </div>

                        <div className="h-2.5 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden relative z-10">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                            />
                        </div>
                        <p className="mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] italic text-left">
                            Battle in more arenas to elevate your standing.
                        </p>
                    </div>

                    <Link
                        href="/profile/stats"
                        className="mt-8 hidden lg:inline-flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest transition-all group/btn shadow-xl shadow-indigo-600/30 active:scale-95"
                    >
                        Deep Battle Analysis
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Right: The Grid of Magnitude */}
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-row items-stretch gap-4 justify-center w-full lg:w-auto">
                    {[
                        { label: 'Career Runs', value: loading ? "---" : totalRuns.toLocaleString(), icon: Activity, color: 'indigo' },
                        { label: 'Global Rank', value: loading ? "#--" : `#${stats?.rank ?? "--"}`, icon: TrendingUp, color: 'purple' },
                        { label: 'Net Value', value: loading ? "₹--" : `₹${stats?.netWorth?.toLocaleString() ?? 0}`, icon: Zap, color: 'emerald' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 lg:w-44 shadow-2xl group/card hover:border-white/20 transition-all duration-500 relative overflow-hidden text-center">
                            <div className={`absolute inset-0 bg-gradient-to-b from-${item.color}-500/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity`} />
                            <item.icon className={`w-6 h-6 text-${item.color}-400 mb-5`} />
                            <span className="text-3xl lg:text-4xl font-black text-white italic tracking-tighter leading-none mb-3 tabular-nums">
                                {item.value}
                            </span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Mobile Only Action Button */}
                <Link
                    href="/profile/stats"
                    className="lg:hidden w-full flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 border border-indigo-400/30 rounded-2xl text-[11px] font-black text-white uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                    Deep Battle Analysis
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
            </div>
        </section>
    );
}
