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
    Clock,
    Zap,
    Target,
    Activity
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

// REBALANCED COMPONENT: Intensity Heatmap
function IntensityHeatmap({ matches, startDate }: { matches: any[], startDate: string }) {
    const start = new Date(startDate);
    const dayLabels = ['FRI', 'SAT', 'SUN', 'MON', 'TUE', 'WED', 'THU'];
    
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
        <div className="w-full mt-6 p-6 bg-[#0A0F1C]/60 border border-white/5 rounded-3xl relative overflow-hidden group/heatmap backdrop-blur-xl shadow-inner">
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-indigo-500/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Intensity Map</span>
                </div>
                <div className="flex items-center gap-4 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                    <span>Base</span>
                    <div className="w-8 h-1.5 bg-indigo-500/10 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-indigo-500" />
                    </div>
                    <span className="text-indigo-400">Peak</span>
                </div>
            </div>
            <div className="h-28 flex items-end justify-between gap-4 px-2 relative z-10">
                {dailyStats.map((runs, idx) => {
                    const h = (runs / maxRuns) * 100;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-3 group/bar">
                            <div className="relative w-full flex flex-col items-center justify-end h-full">
                                {runs > 0 && (
                                    <div className="absolute -top-8 opacity-0 group-hover/bar:opacity-100 transition-all duration-300">
                                        <span className="text-[10px] font-black text-white italic tabular-nums bg-indigo-600 px-2 py-0.5 rounded-lg">{runs}</span>
                                    </div>
                                )}
                                <motion.div 
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(h, 6)}%` }}
                                    transition={{ duration: 1, delay: idx * 0.05 }}
                                    className={`w-full max-w-[20px] rounded-t-lg relative transition-all duration-500 ${runs > 0 ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 opacity-30'}`}
                                />
                            </div>
                            <span className={`text-[8px] font-black tracking-widest ${runs > 0 ? 'text-white' : 'text-slate-600'}`}>{dayLabels[idx]}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function TrendBadge({ current, previous, label }: { current: number, previous: number, label: string }) {
    if (previous === 0) return null;
    const diff = current - previous;
    const pct = ((diff / Math.abs(previous)) * 100).toFixed(0);
    const isUp = diff >= 0;
    return (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${isUp ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            {isUp ? '↑' : '↓'} {Math.abs(Number(pct))}%
        </div>
    );
}

export function WeeklyReportCard({ weeks, loading }: WeeklyReportCardProps) {
    const { data: session } = useSession();
    const [currentIndex, setCurrentIndex] = useState(0);
    const reportRef = useRef<HTMLDivElement>(null);
    const fullReportRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);

    const currentWeek = weeks[currentIndex];
    const previousWeek = weeks[currentIndex + 1] || null;

    if (loading || !currentWeek) {
        return (
            <div className="w-full h-[400px] bg-slate-950/20 rounded-3xl border border-white/5 animate-pulse flex items-center justify-center">
                <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    const handleDownload = async () => {
        if (!fullReportRef.current) return;
        try {
            setDownloading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            const dataUrl = await toPng(fullReportRef.current, { cacheBust: true, backgroundColor: '#050B14', width: 1200, height: 1600 });
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (1600 * pdfWidth) / 1200;
            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Report_${currentWeek.label.replace(/\s+/g, '_')}.pdf`);
        } catch (err) { console.error(err); } finally { setDownloading(false); }
    };

    return (
        <section className="relative group/report">
            {/* CLEAN NAV HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-2">
                <div className="flex items-center gap-5">
                    <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                        <BarChart3 className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic">Weekly <span className="text-amber-500">Pulse</span></h2>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 opacity-60">Session Intelligence Audit</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-950/60 border border-white/10 rounded-xl p-1">
                        <button onClick={() => currentIndex < weeks.length - 1 && setCurrentIndex(prev => prev + 1)} disabled={currentIndex === weeks.length - 1} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-20"><ChevronLeft className="w-4 h-4 text-white" /></button>
                        <div className="px-4 border-x border-white/5"><span className="text-[10px] font-black text-white uppercase tracking-widest tabular-nums">{currentWeek.label}</span></div>
                        <button onClick={() => currentIndex > 0 && setCurrentIndex(prev => prev - 1)} disabled={currentIndex === 0} className="p-2 hover:bg-white/5 rounded-lg disabled:opacity-20"><ChevronRight className="w-4 h-4 text-white" /></button>
                    </div>
                    <button onClick={handleDownload} disabled={downloading} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        {downloading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        {downloading ? "Exporting" : "Audit Export"}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    ref={reportRef}
                    key={currentWeek.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="relative overflow-hidden rounded-[2.5rem] p-6 md:p-10 bg-[#0A0F1C]/90 border border-white/10 shadow-2xl backdrop-blur-2xl"
                >
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/[0.03] blur-[100px] pointer-events-none" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        {/* LEFT: Metrics & Feed (7/12) */}
                        <div className="lg:col-span-7 flex flex-col gap-10">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="space-y-4">
                                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Session Vitality</h3>
                                    <div className="space-y-3">
                                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Runs Scored</span>
                                                <TrendBadge current={currentWeek.stats.runs} previous={previousWeek?.stats.runs || 0} label="Runs" />
                                            </div>
                                            <p className="text-4xl font-black text-white italic tabular-nums tracking-tight">{currentWeek.stats.runs.toLocaleString()}</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Average Level</span>
                                                <TrendBadge current={parseFloat(currentWeek.stats.average)} previous={parseFloat(previousWeek?.stats.average || "0")} label="Avg" />
                                            </div>
                                            <p className="text-4xl font-black text-indigo-400 italic tabular-nums tracking-tight">{currentWeek.stats.average}</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Financial Yield</h3>
                                    <div className="p-6 h-full rounded-3xl bg-slate-900/50 border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-indigo-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3">Total Net Worth</span>
                                        <span className={`text-4xl md:text-5xl font-black italic tracking-tighter tabular-nums mb-4 ${currentWeek.stats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {currentWeek.stats.netWorth >= 0 ? `+₹${currentWeek.stats.netWorth.toLocaleString()}` : `-₹${Math.abs(currentWeek.stats.netWorth).toLocaleString()}`}
                                        </span>
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1 }} className={`h-full ${currentWeek.stats.netWorth >= 0 ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`} />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <section className="space-y-6">
                                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Match Chronicles</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentWeek.matches.slice(0, 4).map((m: any, i: number) => (
                                        <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 group hover:bg-white/[0.04] transition-all">
                                            <div className={`w-2 h-2 rounded-full ${m.outcome === 'win' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[11px] font-black text-white uppercase italic truncate max-w-[100px]">{m.venue?.split(',')[0]}</span>
                                                    <span className={`text-[12px] font-black tabular-nums ${m.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{Math.abs(m.pnl)}</span>
                                                </div>
                                                <div className="flex justify-between items-center opacity-40 text-[8px] font-black uppercase tracking-widest">
                                                    <span>{m.runs} Runs</span>
                                                    <span>{new Date(m.date).toLocaleDateString([], { weekday: 'short' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col gap-4">
                                    <Link href="/profile/stats" className="w-full py-4 bg-indigo-600/10 border border-indigo-500/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-600/20 transition-all">
                                        Analyze Full History <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/[0.015] border border-white/5 rounded-2xl flex items-center gap-4">
                                            <Trophy className="w-4 h-4 text-amber-500/50" />
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Week High</span>
                                                <span className="text-lg font-black text-white italic tabular-nums">{Math.max(...currentWeek.matches.map((m: any) => m.runs), 0)}</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/[0.015] border border-white/5 rounded-2xl flex items-center gap-4">
                                            <Clock className="w-4 h-4 text-indigo-400/50" />
                                            <div>
                                                <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest">Intensity</span>
                                                <span className="text-lg font-black text-white italic tabular-nums">{currentWeek.matches.reduce((acc: number, m: any) => acc + (m.balls || 0), 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* RIGHT: Mastery & Ledger (5/12) */}
                        <div className="lg:col-span-5 flex flex-col gap-10">
                            <section className="bg-black/30 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center">
                                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-8">Success Probability</h3>
                                <div className="relative flex items-center justify-center mb-8">
                                    <PerformanceHub percentage={parseFloat(currentWeek.stats.wins > 0 ? ((currentWeek.stats.wins / (currentWeek.stats.wins + currentWeek.stats.losses)) * 100).toFixed(0) : "0")} wins={currentWeek.stats.wins} losses={currentWeek.stats.losses} />
                                </div>
                            </section>

                            <section className="flex-1 flex flex-col">
                                <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 mb-5">Financial Audit</h3>
                                <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                                    {currentWeek.ledger.length > 0 ? (
                                        currentWeek.ledger.map((item: any, i: number) => (
                                            <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-[11px] font-black text-slate-600">{item.name[0]}</div>
                                                    <div>
                                                        <span className="block text-[11px] font-black text-white uppercase italic">{item.name}</span>
                                                        <span className="text-[8px] font-black text-slate-700 uppercase tracking-widest">Yield Audit</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`block text-sm font-black italic tabular-nums ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{Math.abs(item.amount).toLocaleString()}</span>
                                                    <span className={`text-[7px] font-black uppercase ${item.amount >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>{item.amount >= 0 ? 'Credit' : 'Debit'}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-10 text-center opacity-20"><RefreshCcw className="w-6 h-6 mx-auto mb-3 animate-spin-slow" /><span className="text-[9px] font-black uppercase tracking-widest">Audit Waiting</span></div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* FOOTER: Intensity View */}
                        <div className="lg:col-span-12 pt-8 border-t border-white/5">
                            <IntensityHeatmap matches={currentWeek.matches} startDate={currentWeek.startDate} />
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <WeeklyReportTemplate ref={fullReportRef} week={currentWeek} userName={session?.user?.name || "Member"} />
            </div>
        </section>
    );
}

function PerformanceHub({ percentage, wins, losses }: { percentage: number, wins: number, losses: number }) {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = percentage >= 80 ? '#10b981' : percentage >= 50 ? '#6366f1' : '#f43f5e';

    return (
        <div className="flex flex-col items-center gap-8 w-full">
            <div className="relative flex items-center justify-center">
                <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                    <motion.circle cx="80" cy="80" r={radius} stroke={color} strokeWidth="8" fill="transparent" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset }} transition={{ duration: 1.5 }} strokeLinecap="round" />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-white italic leading-none">{percentage}%</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-1" style={{ color }}>Mastery</span>
                </div>
            </div>
            <div className="flex gap-4 w-full">
                <div className="flex-1 bg-white/[0.03] p-3 rounded-2xl text-center border border-white/5"><span className="block text-[8px] font-black text-slate-600 uppercase mb-1">Wins</span><span className="text-xl font-black text-emerald-400 tabular-nums">{wins}</span></div>
                <div className="flex-1 bg-white/[0.03] p-3 rounded-2xl text-center border border-white/5"><span className="block text-[8px] font-black text-slate-600 uppercase mb-1">Loss</span><span className="text-xl font-black text-rose-400 tabular-nums">{losses}</span></div>
            </div>
        </div>
    );
}

const WeeklyReportTemplate = React.forwardRef<HTMLDivElement, { week: any, userName: string }>(({ week, userName }, ref) => (
    <div ref={ref} className="w-[1200px] p-20 bg-[#050B14] text-white">
        <h1 className="text-4xl font-black uppercase mb-10 border-b border-white/10 pb-5">Weekly Insight • {week.label}</h1>
        <div className="grid grid-cols-3 gap-10 text-center">
            <div className="p-10 bg-slate-900 rounded-3xl"><p className="text-5xl font-black mb-2">{week.stats.runs}</p><p className="text-sm font-black uppercase text-slate-500">Total Runs</p></div>
            <div className="p-10 bg-slate-900 rounded-3xl"><p className={`text-5xl font-black mb-2 ${week.stats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{Math.abs(week.stats.netWorth)}</p><p className="text-sm font-black uppercase text-slate-500">P&L</p></div>
            <div className="p-10 bg-slate-900 rounded-3xl"><p className="text-5xl font-black mb-2">{week.stats.wins}</p><p className="text-sm font-black uppercase text-slate-500">Wins</p></div>
        </div>
    </div>
));
WeeklyReportTemplate.displayName = "WeeklyReportTemplate";
