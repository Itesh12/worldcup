"use client";

import React, { useEffect, useState } from "react";
import { PartyPopper, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Winner {
    match: {
        date: string;
        teams: { shortName: string }[];
    };
    winner: {
        name: string;
        image?: string;
        score: number;
        strikeRate: string;
    };
}

export function HallOfFameSection() {
    const [winners, setWinners] = useState<Winner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWinners();
    }, []);

    const fetchWinners = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/matches/winners', {
                headers: { 'Accept': 'application/json' },
                cache: 'no-store'
            });

            if (!res.ok) throw new Error(`Cloud Error: ${res.status}`);

            const data = await res.json();
            setWinners(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Hall of Fame fetch failed", err);
            setWinners([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading || winners.length === 0) return null;

    return (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="p-3.5 md:p-4 bg-indigo-500/10 rounded-[1.25rem] border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                        <PartyPopper className="w-6 h-6 md:w-7 md:h-7 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">Hall of <span className="text-indigo-500 italic">Fame</span></h2>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Recent Match Champions</p>
                    </div>
                </div>

                <Link
                    href="/hall-of-fame"
                    className="w-full sm:w-auto px-6 py-3 bg-slate-900/60 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all border border-white/5 flex items-center justify-center gap-3 group shadow-xl hover:border-indigo-500/30 overflow-hidden relative whitespace-nowrap"
                >
                    <span className="relative z-10">View All</span>
                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:translate-x-1 transition-transform relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
            </div>

            <div className="flex lg:grid overflow-x-auto lg:overflow-x-visible snap-x snap-mandatory lg:snap-none lg:grid-cols-3 gap-6 scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0">
                {winners.map((item, idx) => (
                    <div key={idx} className="min-w-[85vw] md:min-w-[45vw] lg:min-w-0 snap-center shrink-0 lg:shrink group relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all duration-500 hover:bg-slate-900/60 shadow-lg">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />

                        <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(item.match.date).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black text-white uppercase">{item.match.teams[0]?.shortName} <span className="text-slate-600">vs</span> {item.match.teams[1]?.shortName}</h3>
                                </div>
                            </div>
                            <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Winner</span>
                            </div>
                        </div>

                        <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 via-orange-500 to-yellow-600 p-[2px] shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                                <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden">
                                    {item.winner.image ? (
                                        <img src={item.winner.image} alt={item.winner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-xs font-black text-white">{item.winner.name[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-black text-white truncate group-hover:text-indigo-400 transition-colors">{item.winner.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-white">{item.winner.score}</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">Runs</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-700" />
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-black text-indigo-400">{item.winner.strikeRate}</span>
                                        <span className="text-[8px] font-bold text-slate-500 uppercase">S/R</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
