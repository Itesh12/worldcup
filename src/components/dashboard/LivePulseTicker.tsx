"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Zap, ChevronLeft, ChevronRight, Activity, Trophy, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveContest {
    arenaId: string;
    arenaName: string;
    matchId: string;
    teams: { name: string; shortName: string }[];
    inningsNumber: number;
    position: number;
    score: {
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        isOut: boolean;
    };
    matchStatus: string;
}

export function LivePulseTicker() {
    const [contests, setContests] = useState<ActiveContest[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const fetchContests = async () => {
        try {
            const res = await fetch('/api/user/active-contests');
            if (res.ok) {
                const data = await res.json();
                setContests(data);
            }
        } catch (error) {
            console.error("Live Pulse Refresh Failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContests();
        const interval = setInterval(fetchContests, 30000); // 30 sec sync
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isAutoPlaying && contests.length > 1) {
            autoPlayRef.current = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % contests.length);
            }, 6000);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isAutoPlaying, contests.length]);

    const handleManualNav = (direction: 'next' | 'prev') => {
        setIsAutoPlaying(false);
        if (direction === 'next') {
            setCurrentIndex((prev) => (prev + 1) % contests.length);
        } else {
            setCurrentIndex((prev) => (prev - 1 + contests.length) % contests.length);
        }
        // Resume autoplay after 15 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 15000);
    };

    // Fallback UI when no contests are live
    const currentContest = contests[currentIndex] || {
        arenaId: 'standby',
        arenaName: 'Global Monitoring',
        inningsNumber: 0,
        position: 0,
        score: { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
        teams: [{ shortName: 'WAIT' }, { shortName: 'LIVE' }]
    };

    return (
        <div className="relative w-full overflow-hidden bg-slate-900/40 border-y border-white/5 backdrop-blur-xl h-14 md:h-16 flex items-center group">
            {/* Live Indicator */}
            <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-4 md:px-8 bg-gradient-to-r from-slate-950 via-slate-950 to-transparent">
                <div className="flex items-center gap-2 md:gap-3 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full shadow-lg shadow-red-500/10 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] md:text-xs font-black text-red-500 uppercase tracking-widest italic">Live Pulse</span>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex justify-center items-center overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentContest.arenaId + currentIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex items-center gap-6 md:gap-12 px-12 md:px-0"
                    >
                        {/* Match Context */}
                        <div className="hidden sm:flex items-center gap-3">
                            <span className="text-[10px] md:text-xs font-black text-white italic">{currentContest.teams[0].shortName}</span>
                            <div className="w-4 md:w-6 h-px bg-white/20" />
                            <span className="text-[10px] md:text-xs font-black text-white italic">{currentContest.teams[1].shortName}</span>
                        </div>

                        {/* Position Focus - Only for active contests */}
                        {contests.length > 0 && (
                            <div className="flex items-center gap-3 md:gap-4 px-4 md:px-6 py-1.5 bg-white/5 border border-white/5 rounded-2xl">
                                <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                                    <Crosshair className="w-3 h-3 md:w-3.5 md:h-3.5 text-indigo-400" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Your Slot</span>
                                    <span className="text-[11px] md:text-xs font-black text-white uppercase italic">Inn {currentContest.inningsNumber} • Pos {currentContest.position}</span>
                                </div>
                            </div>
                        )}

                        {/* Live Score Operational Data */}
                        {contests.length > 0 ? (
                            <div className="flex items-center gap-4 md:gap-8">
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Runs</span>
                                    <span className="text-sm md:text-lg font-black text-indigo-400 italic drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                        {currentContest.score.runs}
                                    </span>
                                </div>
                                <div className="w-px h-6 bg-white/10" />
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Balls</span>
                                    <span className="text-sm md:text-lg font-black text-white italic">{currentContest.score.balls}</span>
                                </div>
                                <div className="hidden xs:flex flex-col items-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Strike Rate</span>
                                    <span className="text-sm md:text-lg font-black text-white italic">
                                        {currentContest.score.balls > 0 ? ((currentContest.score.runs / currentContest.score.balls) * 100).toFixed(1) : '0.0'}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 md:gap-8 opacity-40">
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1 text-center font-black">No Live OPS</span>
                                    <span className="text-[10px] md:text-xs font-black text-white uppercase italic">Monitoring...</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center px-4 md:px-8 bg-gradient-to-l from-slate-950 via-slate-950 to-transparent gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {contests.length > 1 && (
                    <>
                        <button 
                            onClick={() => handleManualNav('prev')}
                            className="p-1.5 md:p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        </button>
                        <button 
                            onClick={() => handleManualNav('next')}
                            className="p-1.5 md:p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
                        >
                            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                        </button>
                    </>
                )}
                <div className="hidden sm:flex items-center gap-1.5 ml-2 md:ml-4 px-2.5 py-1 bg-white/5 rounded-full border border-white/5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] md:text-[9px] font-black text-white/40 uppercase tracking-widest">{currentIndex + 1}/{contests.length}</span>
                </div>
            </div>
        </div>
    );
}
