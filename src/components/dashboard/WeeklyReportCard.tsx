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

export function WeeklyReportCard({ weeks, loading }: WeeklyReportCardProps) {
    const { data: session } = useSession();
    const [currentIndex, setCurrentIndex] = useState(0);
    const reportRef = useRef<HTMLDivElement>(null);
    const fullReportRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    if (loading) {
        return (
            <div className="w-full h-[400px] bg-slate-900/20 rounded-[2rem] border border-white/5 animate-pulse flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compiling Weekly Insight...</span>
                </div>
            </div>
        );
    }

    if (!weeks || weeks.length === 0) return null;

    const currentWeek = weeks[currentIndex];
    if (!currentWeek) return null;

    const isLatest = currentIndex === 0;
    const isOldest = currentIndex === weeks.length - 1;

    const handlePrev = () => {
        if (!isOldest) setCurrentIndex(prev => prev + 1);
    };
    const handleNext = () => {
        if (!isLatest) setCurrentIndex(prev => prev - 1);
    };

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 shrink-0">
                        <BarChart3 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Weekly <span className="text-amber-500">Pulse</span></h2>
                        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">{currentIndex === 0 ? "Current Week Overview" : "Previous Week Review"}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 bg-slate-900/60 border border-white/5 rounded-xl p-1">
                        <button
                            onClick={handlePrev}
                            disabled={isOldest}
                            className={`p-2 rounded-lg transition-all ${isOldest ? 'opacity-30 text-slate-600' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <div className="px-2 md:px-4">
                            <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">{currentWeek.label}</span>
                        </div>
                        <button
                            onClick={handleNext}
                            disabled={isLatest}
                            className={`p-2 rounded-lg transition-all ${isLatest ? 'opacity-30 text-slate-600' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                        >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                    <div className="hidden sm:block w-px h-6 bg-white/5 mx-1" />
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        {downloading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {downloading ? "Exporting" : "Download"}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    ref={reportRef}
                    key={currentWeek.key}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.05, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 bg-slate-900/40 border border-white/5 shadow-2xl backdrop-blur-md"
                >
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                        <div className="lg:col-span-4 space-y-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Performance Score</h3>
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Runs</p>
                                            <p className="text-xl md:text-2xl font-black text-white">{currentWeek.stats.runs}</p>
                                        </div>
                                        <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5">
                                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Average</p>
                                            <p className="text-xl md:text-2xl font-black text-indigo-400">{currentWeek.stats.average}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Financial Flow</h3>
                                    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-white/5 shadow-inner">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-slate-500">Net Weekly P&L</span>
                                            <span className={`text-xl font-black ${currentWeek.stats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {currentWeek.stats.netWorth >= 0 ? `+₹${currentWeek.stats.netWorth}` : `-₹${Math.abs(currentWeek.stats.netWorth)}`}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className={`h-full ${currentWeek.stats.netWorth >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5 flex items-center justify-between">
                                        Performance Hub
                                        <Trophy className="w-3 h-3 text-amber-500" />
                                    </h3>
                                    <div className="relative group/hub p-6 rounded-[2rem] bg-slate-950/50 border border-white/5 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-amber-500/5 opacity-0 group-hover/hub:opacity-100 transition-opacity duration-700" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <PerformanceHub percentage={parseFloat(currentWeek.stats.wins > 0 ? ((currentWeek.stats.wins / (currentWeek.stats.wins + currentWeek.stats.losses)) * 100).toFixed(0) : "0")} wins={currentWeek.stats.wins} losses={currentWeek.stats.losses} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <PieChart className="w-3 h-3 text-amber-500" />
                                Settlement Ledger
                            </h3>
                            <div className="space-y-2 md:space-y-3 max-h-[300px] md:max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                                {currentWeek.ledger.length > 0 ? (
                                    currentWeek.ledger.map((item: any) => (
                                        <div key={item.userId} className="p-3 md:p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-800 flex items-center justify-center text-[9px] md:text-[10px] font-black text-slate-400 shrink-0">
                                                        {item.name[0]}
                                                    </div>
                                                    <span className="text-[11px] md:text-xs font-bold text-white truncate max-w-[100px]">{item.name}</span>
                                                </div>
                                                <span className={`text-[11px] md:text-xs font-black ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {item.amount >= 0 ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center opacity-30">
                                        <span className="text-[8px] font-black uppercase tracking-widest">No Transactions This Week</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-6">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                <Clock className="w-3 h-3 text-purple-500" />
                                Recent Activity
                            </h3>
                            <div className="space-y-3 md:space-y-4">
                                {currentWeek.matches.slice(0, 4).map((m: any, idx: number) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="group/item flex items-center gap-3 md:gap-4 p-3 md:p-4 bg-slate-950/40 rounded-2xl border border-white/5"
                                    >
                                        <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0 ${m.outcome === 'win' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5 gap-2">
                                                <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-tight truncate">{m.venue?.split(',')[0] || "Match"}</span>
                                                <span className={`text-[9px] md:text-[10px] font-bold shrink-0 ${m.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {m.pnl >= 0 ? `+₹${m.pnl}` : `-₹${Math.abs(m.pnl)}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[7px] md:text-[8px] font-bold text-slate-600 uppercase whitespace-nowrap">Res: {m.runs} ({m.balls})</span>
                                                <span className="text-[7px] md:text-[8px] font-bold text-indigo-400 uppercase">{new Date(m.date).toLocaleDateString([], { weekday: 'short' })}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <Link href="/profile/stats" className="flex items-center justify-center gap-2 w-full py-3 mt-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest">
                                View Full Analytics
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <WeeklyReportTemplate ref={fullReportRef} week={currentWeek} userName={session?.user?.name || "Player"} />
            </div>
        </section>
    );
}

function PerformanceHub({ percentage, wins, losses }: { percentage: number, wins: number, losses: number }) {
    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = () => {
        if (percentage >= 80) return { primary: '#10b981', label: 'Elite' };
        if (percentage >= 50) return { primary: '#f59e0b', label: 'Pro' };
        return { primary: '#f43f5e', label: 'Growing' };
    };

    const style = getColor();

    return (
        <div className="flex flex-col items-center gap-6 w-full">
            <div className="relative flex items-center justify-center">
                <div className="absolute inset-x-[-15%] inset-y-[-15%] rounded-full blur-2xl opacity-20 transition-colors duration-1000" style={{ backgroundColor: style.primary }} />
                <svg className="w-32 h-32 transform -rotate-90">
                    <defs>
                        <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={style.primary} />
                            <stop offset="100%" stopColor={percentage >= 50 ? '#6366f1' : '#fb7185'} />
                        </linearGradient>
                    </defs>
                    <circle cx="64" cy="64" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
                    <motion.circle cx="64" cy="64" r={radius} stroke="url(#hubGradient)" strokeWidth="5" fill="transparent" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: "circOut" }} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{percentage}%</span>
                    <span className="text-[6px] font-black uppercase tracking-[0.4em] mt-2" style={{ color: style.primary }}>{style.label}</span>
                </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <div className="flex items-center justify-center gap-2 py-3 bg-slate-950/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="text-[8px] font-black text-slate-400">WINS: <span className="text-white ml-1">{wins}</span></span>
                </div>
                <div className="flex items-center justify-center gap-2 py-3 bg-slate-950/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    <span className="text-[8px] font-black text-slate-400">LOSS: <span className="text-white ml-1">{losses}</span></span>
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
