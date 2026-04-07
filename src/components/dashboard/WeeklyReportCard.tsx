"use client";

import React, { useState, useRef } from "react";
import { 
    BarChart3, 
    ChevronLeft, 
    ChevronRight, 
    Download, 
    RefreshCcw, 
    ArrowRight, 
    Trophy, 
    PieChart, 
    Clock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface WeeklyReportCardProps {
    weeks: any[];
    loading: boolean;
}

function IntensityHeatmap({ matches, startDate }: { matches: any[], startDate: string }) {
    const start = new Date(startDate);
    const dayLabels = ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']; // Friday start logic
    
    const dailyStats = new Array(7).fill(0);
    matches.forEach(m => {
        const mDate = new Date(m.date);
        const diffDays = Math.floor((mDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
            dailyStats[diffDays] += m.runs;
        }
    });

    const maxRuns = Math.max(...dailyStats, 10);

    return (
        <div className="w-full mt-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden group/heatmap">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Battle Intensity Map</span>
                </div>
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">7-Day Strategic Cycle</span>
            </div>
            <div className="h-32 flex items-end justify-between gap-4 px-2 relative z-10">
                {dailyStats.map((runs, idx) => {
                    const h = (runs / maxRuns) * 100;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-4 group/bar">
                            <div className="relative w-full flex flex-col items-center justify-end h-full">
                                {runs > 0 && (
                                    <div className="absolute -top-8 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 transform translate-y-2 group-hover/bar:translate-y-0">
                                        <span className="text-[11px] font-black text-white italic tabular-nums bg-indigo-600 px-2 py-1 rounded-lg border border-indigo-400/30 shadow-[0_5px_15px_rgba(99,102,241,0.4)]">{runs}</span>
                                    </div>
                                )}
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(h, 6)}%` }}
                                    transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                                    className={`w-full max-w-[24px] rounded-t-xl transition-all duration-500 ${runs > 0 ? 'bg-gradient-to-t from-indigo-600 via-indigo-400 to-purple-400 shadow-[0_0_25px_rgba(99,102,241,0.4)]' : 'bg-white/5 opacity-40'}`}
                                />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${runs > 0 ? 'text-slate-300' : 'text-slate-600'}`}>{dayLabels[idx]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TrendBadge({ current, previous, label, isCurrency = false }: { current: number, previous: number, label: string, isCurrency?: boolean }) {
    if (previous === 0) return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 opacity-40 group-hover:opacity-100 transition-opacity">
            <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Calibrating</span>
        </div>
    );
    
    const diff = current - previous;
    const pct = ((diff / Math.abs(previous)) * 100).toFixed(0);
    const isUp = diff >= 0;

    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all ${isUp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            <span className="text-[8px] font-black uppercase tracking-tighter tabular-nums leading-none">
                {isUp ? '↑' : '↓'} {Math.abs(Number(pct))}% {label}
            </span>
        </div>
    );
}

export function WeeklyReportCard({ weeks, loading }: WeeklyReportCardProps) {
    const { data: session } = useSession();
    const [currentIndex, setCurrentIndex] = useState(0);
    const reportRef = useRef<HTMLDivElement>(null);
    const fullReportRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    if (loading) {
        return (
            <div className="w-full h-[400px] bg-slate-900/20 rounded-[3rem] border border-white/10 animate-pulse flex items-center justify-center backdrop-blur-md">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(99,102,241,0.3)]" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Analyzing Session Intelligence...</span>
                </div>
            </div>
        );
    }

    if (!weeks || weeks.length === 0) return null;

    const currentWeek = weeks[currentIndex];
    const previousWeek = weeks[currentIndex + 1] || null;
    
    if (!currentWeek) return null;

    const isLatest = currentIndex === 0;
    const isOldest = currentIndex === weeks.length - 1;

    const handleDownload = async () => {
        if (!fullReportRef.current) return;
        try {
            setDownloading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            const dataUrl = await toPng(fullReportRef.current, {
                cacheBust: true,
                backgroundColor: '#050B14',
                width: 1200,
                height: 1600,
            });
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (1600 * pdfWidth) / 1200;
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`WorldCupHub_Report_${currentWeek.label.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error("PDF Export failed", err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <section className="relative group/report">
            {/* Nav Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-amber-500/10 rounded-3xl border border-amber-500/20 shrink-0 shadow-2xl">
                        <BarChart3 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic">Weekly <span className="text-amber-500">Pulse</span></h2>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-[0.4em] leading-none mt-2">{currentIndex === 0 ? "Strategic Current Session" : "Historical Combat Review"}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-0 bg-slate-950/60 border border-white/10 rounded-2xl p-1 shadow-2xl">
                        <button
                            onClick={() => !isOldest && setCurrentIndex(prev => prev + 1)}
                            disabled={isOldest}
                            className={`p-3 rounded-xl transition-all ${isOldest ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5 text-white active:scale-95'}`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="px-6 border-x border-white/5">
                            <span className="text-[11px] font-black text-white uppercase tracking-widest whitespace-nowrap tabular-nums">{currentWeek.label}</span>
                        </div>
                        <button
                            onClick={() => !isLatest && setCurrentIndex(prev => prev - 1)}
                            disabled={isLatest}
                            className={`p-3 rounded-xl transition-all ${isLatest ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5 text-white active:scale-95'}`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-indigo-600/20 flex items-center gap-3"
                    >
                        {downloading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        {downloading ? "Compiling PDF" : "Audit Export"}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    ref={reportRef}
                    key={currentWeek.key}
                    initial={{ opacity: 0, scale: 0.98, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -20 }}
                    transition={{ duration: 0.5, ease: "circOut" }}
                    className="relative overflow-hidden rounded-[3rem] p-8 md:p-14 bg-[#0A0F1C]/80 border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
                >
                    {/* Atmospheric Glows */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/[0.04] blur-[150px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-500/[0.04] blur-[150px] rounded-full pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-14">
                        
                        {/* LEFT: Core Metrics & Chronicle (7/12) */}
                        <div className="lg:col-span-7 space-y-14">
                            
                            {/* Performance Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">Battle Scores</h3>
                                    <div className="space-y-4">
                                        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all group/card">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Runs Scored</span>
                                                <TrendBadge current={currentWeek.stats.runs} previous={previousWeek?.stats.runs || 0} label="Runs" />
                                            </div>
                                            <p className="text-5xl font-black text-white italic tracking-tighter leading-none">{currentWeek.stats.runs.toLocaleString()}</p>
                                        </div>
                                        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all group/card">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Batting Power Index</span>
                                                <TrendBadge current={parseFloat(currentWeek.stats.average)} previous={parseFloat(previousWeek?.stats.average || "0")} label="Skill" />
                                            </div>
                                            <p className="text-5xl font-black text-indigo-400 italic tracking-tighter leading-none">{currentWeek.stats.average}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">Financial Flow</h3>
                                    <div className="p-8 h-full rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-black border border-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] flex flex-col justify-center relative overflow-hidden group/pnl">
                                        <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover/pnl:opacity-100 transition-opacity" />
                                        <div className="relative z-10 flex flex-col mb-8">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Weekly Yield</span>
                                                <TrendBadge current={currentWeek.stats.netWorth} previous={previousWeek?.stats.netWorth || 0} label="Flux" isCurrency />
                                            </div>
                                            <span className={`text-5xl md:text-6xl font-black italic tracking-tighter leading-none tabular-nums ${currentWeek.stats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {currentWeek.stats.netWorth >= 0 ? `+₹${currentWeek.stats.netWorth.toLocaleString()}` : `-₹${Math.abs(currentWeek.stats.netWorth).toLocaleString()}`}
                                            </span>
                                        </div>
                                        <div className="relative z-10 w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-[2px]">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1.5, delay: 0.5 }}
                                                className={`h-full rounded-full ${currentWeek.stats.netWorth >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.5)]'}`}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Match Chronicle */}
                            <section className="space-y-8">
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] flex items-center gap-4 px-2">
                                    <Clock className="w-4 h-4 text-indigo-400" />
                                    Strategic Match Chronicle
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {currentWeek.matches.slice(0, 4).map((m: any, idx: number) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="group/item flex items-center gap-5 p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-white/[0.05]"
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${m.outcome === 'win' ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-rose-500 shadow-[0_0_12px_#f43f5e]'}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1 gap-4">
                                                    <span className="text-[11px] font-black text-white uppercase italic tracking-tight truncate leading-relaxed py-0.5">{m.venue?.split(',')[0] || "Battle Arena"}</span>
                                                    <span className={`text-[12px] font-black tabular-nums shrink-0 ${m.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {m.pnl >= 0 ? `+₹${m.pnl}` : `-₹${Math.abs(m.pnl)}`}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 opacity-50">
                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{m.runs} Runs • {m.balls} Balls</span>
                                                    <span className="text-[9px] font-black text-indigo-400 uppercase">{new Date(m.date).toLocaleDateString([], { weekday: 'short' })}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                <Link href="/profile/stats" className="flex items-center justify-center gap-4 w-full py-5 rounded-[1.5rem] bg-indigo-600/5 border border-indigo-500/10 hover:bg-indigo-600/10 transition-all text-[11px] font-black text-indigo-400 uppercase tracking-widest group/btn">
                                    Analyze Full Battle History
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>

                                {/* Session Highs Refinement */}
                                <div className="grid grid-cols-2 gap-5 pt-8 border-t border-white/5 mt-auto">
                                    <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col gap-2 group/high">
                                        <div className="flex items-center gap-3 mb-1">
                                            <Trophy className="w-3 h-3 text-amber-500" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Personal Best</span>
                                        </div>
                                        <p className="text-2xl font-black text-white italic tabular-nums leading-none">
                                            {Math.max(...currentWeek.matches.map((m: any) => m.runs), 0)} <span className="text-[10px] font-bold text-slate-600 ml-1 uppercase">Runs</span>
                                        </p>
                                    </div>
                                    <div className="p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col gap-2 group/high">
                                        <div className="flex items-center gap-3 mb-1">
                                            <Clock className="w-3 h-3 text-indigo-400" />
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Persistence</span>
                                        </div>
                                        <p className="text-2xl font-black text-white italic tabular-nums leading-none">
                                            {currentWeek.matches.reduce((acc: number, m: any) => acc + (m.balls || 0), 0)} <span className="text-[10px] font-bold text-slate-600 ml-1 uppercase">Balls</span>
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: High-Intensity Hubs (5/12) */}
                        <div className="lg:col-span-5 space-y-14">
                            
                            {/* Pulse Hub */}
                            <section>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center justify-between px-4 underline-offset-[12px]">
                                    Pro Master Hub
                                    <Trophy className="w-4 h-4 text-amber-500/50" />
                                </h3>
                                <div className="relative group/hub p-14 rounded-[4rem] bg-black/40 border border-white/5 overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-amber-500/10 opacity-0 group-hover/hub:opacity-100 transition-all duration-1000" />
                                    <div className="relative z-10">
                                        <PerformanceHub percentage={parseFloat(currentWeek.stats.wins > 0 ? ((currentWeek.stats.wins / (currentWeek.stats.wins + currentWeek.stats.losses)) * 100).toFixed(0) : "0")} wins={currentWeek.stats.wins} losses={currentWeek.stats.losses} />
                                    </div>
                                </div>
                            </section>

                            {/* Settlement Ledger */}
                            <section>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-4 px-4">
                                    <PieChart className="w-4 h-4 text-amber-500" />
                                    Strategic Settlement Audit
                                </h3>
                                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                                    {currentWeek.ledger.length > 0 ? (
                                        currentWeek.ledger.map((item: any) => (
                                            <div key={item.userId} className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem] hover:bg-white/[0.07] transition-all group/ledger">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-sm font-black text-slate-500 group-hover/ledger:text-indigo-400 group-hover/ledger:border-indigo-500/30 transition-all">
                                                            {item.name[0]}
                                                        </div>
                                                        <div>
                                                            <span className="block text-sm font-black text-white uppercase italic tracking-tighter mb-1">{item.name}</span>
                                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Session Payment</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-xl font-black italic tabular-nums leading-none mb-1 ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {item.amount >= 0 ? `+₹${item.amount.toLocaleString()}` : `-₹${Math.abs(item.amount).toLocaleString()}`}
                                                        </p>
                                                        <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Yield Processed</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-28 text-center bg-white/[0.02] border border-white/5 rounded-[2rem] opacity-30">
                                            <RefreshCcw className="w-10 h-10 mx-auto mb-6 text-slate-600/30 animate-spin-slow" />
                                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-700">Financial Audit Pending</span>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* FOOTER: Intensity View (12/12) */}
                        <div className="lg:col-span-12 border-t border-white/10 pt-14 -mx-2">
                             <IntensityHeatmap matches={currentWeek.matches} startDate={currentWeek.startDate} />
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Hidden Export Template */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <WeeklyReportTemplate ref={fullReportRef} week={currentWeek} userName={session?.user?.name || "Gladiator"} />
            </div>
        </section>
    );
}

function PerformanceHub({ percentage, wins, losses }: { percentage: number, wins: number, losses: number }) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage >= 80) return { primary: '#10b981', label: 'Elite', aura: 'rgba(16,185,129,0.3)' };
        if (percentage >= 50) return { primary: '#6366f1', label: 'Pro', aura: 'rgba(99,102,241,0.3)' };
        return { primary: '#f43f5e', label: 'Growing', aura: 'rgba(244,63,94,0.3)' };
    };

    const style = getColor();

    return (
        <div className="flex flex-col items-center gap-10 w-full">
            <div className="relative flex items-center justify-center">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.15, 1],
                        opacity: [0.15, 0.35, 0.15]
                    }}
                    transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-x-[-20%] inset-y-[-20%] rounded-full blur-3xl pointer-events-none" 
                    style={{ backgroundColor: style.primary }} 
                />

                <svg className="w-44 h-44 transform -rotate-90">
                    <defs>
                        <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={style.primary} />
                            <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <circle cx="88" cy="88" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/[0.04]" />
                    <motion.circle 
                        cx="88" cy="88" r={radius} 
                        stroke={style.primary} strokeWidth="1" fill="transparent" 
                        strokeDasharray={circumference} 
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ 
                            strokeDashoffset,
                            opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{ 
                            strokeDashoffset: { duration: 1.5, ease: "circOut" },
                            opacity: { duration: 2, repeat: Infinity }
                        }}
                        strokeLinecap="round"
                    />
                    <motion.circle 
                        cx="88" cy="88" r={radius} 
                        stroke="url(#hubGradient)" strokeWidth="6" fill="transparent" 
                        strokeDasharray={circumference} 
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        strokeLinecap="round"
                        filter="url(#glow)"
                    />
                </svg>

                <div className="absolute flex flex-col items-center justify-center">
                    <motion.span 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-4xl font-black text-white italic tracking-tighter"
                    >
                        {percentage}%
                    </motion.span>
                    <span className="text-[8px] font-black uppercase tracking-[0.5em] mt-2" style={{ color: style.primary }}>{style.label} Rank</span>
                </div>
            </div>

            <div className="w-full flex gap-4 text-center">
                <div className="flex-1 flex flex-col items-center p-4 bg-white/[0.03] border border-white/5 rounded-3xl group/win">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 group-hover/win:text-emerald-400 transition-colors">Victories</span>
                    <span className="text-xl font-black text-emerald-400 italic tabular-nums tracking-tighter">{wins}</span>
                </div>
                <div className="flex-1 flex flex-col items-center p-4 bg-white/[0.03] border border-white/5 rounded-3xl group/loss">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-2 group-hover/loss:text-rose-400 transition-colors">Defeats</span>
                    <span className="text-xl font-black text-rose-400 italic tabular-nums tracking-tighter">{losses}</span>
                </div>
            </div>
        </div>
    );
}

const WeeklyReportTemplate = React.forwardRef<HTMLDivElement, { week: any, userName: string }>(({ week, userName }, ref) => {
    return (
        <div ref={ref} className="w-[1200px] p-20 bg-[#050B14] text-white space-y-12 font-sans">
            <div className="flex items-center justify-between border-b border-white/10 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">WorldCupHub <span className="text-amber-500">Report</span></h1>
                    <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Weekly Performance Insight • {week.label}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-indigo-400 uppercase">{userName}</p>
                    <p className="text-sm font-bold text-slate-600 uppercase">Pro Stats Analysis</p>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem]">
                    <p className="text-sm font-black text-slate-500 uppercase mb-2">Weekly Batting</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black">{week.stats.runs}</span>
                        <span className="text-xl font-bold text-slate-600">Runs</span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem]">
                    <p className="text-sm font-black text-slate-500 uppercase mb-2">Financial Flow</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-6xl font-black ${week.stats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {week.stats.netWorth >= 0 ? `+₹${week.stats.netWorth}` : `-₹${Math.abs(week.stats.netWorth)}`}
                        </span>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem]">
                    <p className="text-sm font-black text-slate-500 uppercase mb-2">Success Rate</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black">{week.stats.wins}</span>
                        <span className="text-xl font-bold text-slate-600">Wins</span>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-12">
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-slate-500 mb-6">Settlement Ledger</h2>
                    <div className="space-y-4">
                        {week.ledger.map((item: any) => (
                            <div key={item.userId} className="p-6 bg-white/5 rounded-3xl flex items-center justify-between">
                                <span className="text-xl font-bold">{item.name}</span>
                                <span className={`text-2xl font-black ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {item.amount >= 0 ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
                <section>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-slate-500 mb-6">Match Feed</h2>
                    <div className="space-y-4">
                        {week.matches.map((m: any, i: number) => (
                            <div key={i} className="p-6 bg-slate-900/60 rounded-3xl border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-lg font-black uppercase">{m.venue?.split(',')[0] || "Match"}</span>
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${m.outcome === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{m.outcome}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    <span>{m.runs} Runs ({m.balls} Balls)</span>
                                    <span>{new Date(m.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
            <div className="pt-20 border-t border-white/10 text-center opacity-30">
                <p className="text-[12px] font-black uppercase tracking-[0.5em]">Auto-Generated by WorldCupHub Intelligence System</p>
            </div>
        </div>
    );
});
WeeklyReportTemplate.displayName = "WeeklyReportTemplate";
