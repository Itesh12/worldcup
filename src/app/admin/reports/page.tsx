"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import {
    FileText,
    Download,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Trophy,
    TrendingUp,
    TrendingDown,
    Users,
    Calendar,
    Activity,
    ArrowUpRight,
    ChevronDown,
    Wallet,
    Zap,
    User as UserIcon
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { Spinner } from "@/components/ui/Spinner";

// Re-using the premium Performance Hub for the list items
function MiniPerformanceHub({ percentage, style }: { percentage: number, style: any }) {
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-10 h-10">
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-white/5"
                />
                <motion.circle
                    cx="20"
                    cy="20"
                    r={radius}
                    stroke={style.primary}
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute text-[8px] font-black text-white">{Math.round(percentage)}%</span>
        </div>
    );
}

// Master Report Template for PDF
const MasterReportTemplate = React.forwardRef<HTMLDivElement, { week: any }>((({ week }, ref) => {
    return (
        <div ref={ref} className="w-[1200px] bg-[#050B14] text-white p-20 font-sans space-y-24">
            {/* PAGE 1: Master Overview */}
            <div className="min-h-[1600px] flex flex-col">
                <div className="flex justify-between items-end border-b border-white/10 pb-10">
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter mb-4 italic">WEEKLY <span className="text-indigo-500">MASTER</span> REPORT</h1>
                        <p className="text-xl font-bold text-slate-500 uppercase tracking-[0.3em]">{week.label}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-black text-slate-500 uppercase tracking-widest leading-relaxed">Platform Authority</p>
                        <p className="text-2xl font-black text-white italic">WorldCupHub Financial Audit</p>
                    </div>
                </div>

                <div className="mt-20 space-y-10">
                    <h2 className="text-3xl font-black uppercase tracking-widest flex items-center gap-4">
                        <Trophy className="w-8 h-8 text-amber-500" />
                        Executive Financial Summary
                    </h2>
                    <div className="grid grid-cols-4 gap-10">
                        <div className="p-10 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Participants</p>
                            <h3 className="text-4xl font-black">{week.users.length} <span className="text-lg text-slate-600">Users</span></h3>
                        </div>
                        <div className="p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-3">Platform Turnover</p>
                            <h3 className="text-4xl font-black">₹{week.totalTurnover.toLocaleString()}</h3>
                        </div>
                        <div className="p-10 rounded-[3rem] bg-amber-500/5 border border-amber-500/10">
                            <p className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-3">Admin Yield</p>
                            <h3 className="text-4xl font-black">₹{week.totalAdminYield.toLocaleString()}</h3>
                        </div>
                        <div className="p-10 rounded-[3rem] bg-purple-500/5 border border-purple-500/10">
                            <p className="text-xs font-black text-purple-400 uppercase tracking-[0.2em] mb-3">Sub-Admin Net</p>
                            <h3 className="text-4xl font-black">₹{week.subAdminRevenue.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="mt-20 flex-1">
                    <h2 className="text-3xl font-black uppercase tracking-widest flex items-center gap-4 mb-8">
                        <FileText className="w-8 h-8 text-indigo-500" />
                        Match Financial Audit Log
                    </h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-left bg-white/5">
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest">Match Identity</th>
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest">Enrolled</th>
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest">Gross Turnover</th>
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest text-right">Admin Take</th>
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest text-right">Sub-Admin Cut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {week.matchReports?.map((m: any, i: number) => (
                                <tr key={i} className="border-b border-white/5">
                                    <td className="py-8 px-6">
                                        <p className="text-2xl font-black uppercase tracking-tighter italic">{m.name}</p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{new Date(m.date).toLocaleDateString()}</p>
                                    </td>
                                    <td className="py-8 px-6 text-xl font-black text-slate-400">{m.enrolled} Slots</td>
                                    <td className="py-8 px-6 text-xl font-black">₹{m.turnover.toLocaleString()}</td>
                                    <td className="py-8 px-6 text-right text-2xl font-black text-emerald-400">₹{m.adminTake.toLocaleString()}</td>
                                    <td className="py-8 px-6 text-right text-2xl font-black text-purple-400">₹{m.subAdminCut.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-32">
                    <h2 className="text-3xl font-black uppercase tracking-widest flex items-center gap-4 mb-8">
                        <Users className="w-8 h-8 text-indigo-500" />
                        Player Breakdown Index
                    </h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-left bg-white/5">
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest">Rank</th>
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest">Operational Identity</th>
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest">Match Turnover</th>
                                <th className="py-8 px-6 text-sm font-black text-slate-500 uppercase tracking-widest text-right">Net Settlement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {week.users.map((u: any, i: number) => (
                                <tr key={i} className="border-b border-white/5">
                                    <td className="py-8 px-6 text-xl font-black text-slate-700">#{i + 1}</td>
                                    <td className="py-8 px-6 flex items-center gap-6">
                                        <span className="text-2xl font-black uppercase tracking-tighter italic">{u.name}</span>
                                    </td>
                                    <td className="py-8 px-6 text-xl font-black">₹{u.stats.turnover.toLocaleString()}</td>
                                    <td className="py-8 px-6 text-right text-3xl font-black" style={{ color: u.stats.netWorth >= 0 ? '#10b981' : '#f43f5e' }}>
                                        {u.stats.netWorth >= 0 ? '+' : ''}₹{u.stats.netWorth.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pt-20 border-t border-white/10 flex justify-between items-center opacity-30 mt-auto">
                    <p className="text-sm font-black uppercase tracking-widest italic">Confidential Financial Analytics</p>
                    <p className="text-sm font-black uppercase tracking-widest">Page 1 of {week.users.length + 1}</p>
                </div>
            </div>

            {/* SUBSEQUENT PAGES: Individual Breakdowns */}
            {week.users.map((u: any, i: number) => (
                <div key={u.userId} className="min-h-[1600px] flex flex-col pt-24">
                    <div className="flex justify-between items-center border-b-4 border-indigo-500 pb-12 mb-16">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center text-4xl font-black italic shadow-2xl">
                                {u.name[0]}
                            </div>
                            <div>
                                <h2 className="text-6xl font-black tracking-tighter uppercase italic">{u.name}</h2>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="px-4 py-1 bg-indigo-500 rounded-full text-xs font-black uppercase tracking-widest">Financial Identity</span>
                                    <span className="text-slate-500 font-bold uppercase tracking-widest text-sm">Wealth Index Rank #{i + 1}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-6xl font-black tracking-tighter" style={{ color: u.stats.netWorth >= 0 ? '#10b981' : '#f43f5e' }}>
                                {u.stats.netWorth >= 0 ? '+' : ''}₹{u.stats.netWorth.toLocaleString()}
                            </span>
                            <p className="text-sm font-black text-slate-500 uppercase tracking-widest mt-2">{u.stats.netWorth >= 0 ? 'Profit Result' : 'Loss Result'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-20">
                        <div className="space-y-12">
                            <h3 className="text-xl font-black uppercase tracking-[0.3em] text-indigo-400">Match Evidence</h3>
                            <div className="space-y-4">
                                {u.matches.map((m: any, mi: number) => (
                                    <div key={mi} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <div>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">{new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} &middot; {m.venue}</p>
                                            <p className="font-black text-lg">{m.runs} Runs <span className="text-slate-500 text-sm font-normal">({m.balls} balls)</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-600 mb-1">{m.outcome}</p>
                                            <p className="font-black text-lg text-slate-400">Turnover Context Prepared</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-12">
                            <h3 className="text-xl font-black uppercase tracking-[0.3em] text-indigo-400">Performance Metrics</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Weekly Turnover</p>
                                    <p className="text-3xl font-black">₹{u.stats.turnover.toLocaleString()}</p>
                                </div>
                                <div className="p-8 bg-white/5 rounded-3xl border border-white/5">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Win Rate</p>
                                    <p className="text-3xl font-black">{Math.round((u.stats.wins / u.matches.length) * 100)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 border-t border-white/10 flex justify-between items-center opacity-30 mt-auto">
                        <p className="text-sm font-black uppercase tracking-widest italic">Proprietary Financial Statement</p>
                        <p className="text-sm font-black uppercase tracking-widest">Page {i + 2} of {week.users.length + 1}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}));

function ReportsContent() {
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";
    const { data: session } = useSession();
    const [weeks, setWeeks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
    const masterReportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await fetch("/api/admin/weekly-report");
            const data = await res.json();
            if (data.weeks) {
                setWeeks(data.weeks);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadMaster = async () => {
        if (!weeks.length) return;
        const currentWeek = weeks[currentWeekIndex];
        if (!masterReportRef.current || downloading) return;
        setDownloading(true);

        try {
            const dataUrl = await toPng(masterReportRef.current, {
                cacheBust: true,
                backgroundColor: '#050B14',
                width: 1200,
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [1200, 1600],
            });

            // True multi-page generation
            // We'll add the first page (Overview)
            pdf.addImage(dataUrl, 'PNG', 0, 0, 1200, 1600 * (currentWeek.users.length + 1));

            // To make it truly paginated for printers, we should slice the image and add pages
            // However, most PDF viewers handle a single long page well for "reports".
            // But if the user wants "expanded state" properly, real pages are better.
            // Simplified multi-page: jsPDF 'addImage' with source clipping
            for (let i = 1; i <= currentWeek.users.length; i++) {
                pdf.addPage([1200, 1600], 'portrait');
                pdf.addImage(dataUrl, 'PNG', 0, -(1600 * i), 1200, 1600 * (currentWeek.users.length + 1));
            }

            pdf.save(`WorldCupHub_MasterReport_${currentWeek.label.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error(err);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!weeks.length) {
        return (
            <div className="max-w-4xl mx-auto py-20 px-6 text-center">
                <Activity className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">No Reports Found</h1>
                <p className="text-slate-500 mt-4 font-bold tracking-widest uppercase text-sm">Waiting for match data to accumulate...</p>
                <Link href={isPlayerView ? "/dashboard?view=player" : "/admin"} className="inline-flex items-center gap-2 mt-10 text-indigo-400 hover:text-indigo-300 font-black uppercase tracking-widest text-xs transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    const currentWeek = weeks[currentWeekIndex];

    return (
        <div className="min-h-screen bg-[#050B14] p-6 md:p-12 text-white">
            {/* Hidden PDF Template */}
            <div className="fixed left-[-9999px] top-0 pointer-events-none">
                <MasterReportTemplate ref={masterReportRef} week={currentWeek} />
            </div>

            <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Navigation & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <Link href={isPlayerView ? "/dashboard?view=player" : "/admin"} className="group flex items-center gap-2 text-slate-500 hover:text-white transition-all">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isPlayerView ? "Back to Dashboard" : "Back to Management"}</span>
                        </Link>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none italic uppercase">
                            Weekly <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 pr-4">Reports Hub</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Week Switcher */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 px-4">
                            <button
                                onClick={() => setCurrentWeekIndex(prev => Math.min(weeks.length - 1, prev + 1))}
                                disabled={currentWeekIndex === weeks.length - 1}
                                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex flex-col items-center min-w-[140px]">
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Selected Week</span>
                                <span className="text-xs font-black text-white uppercase tracking-tighter">{currentWeek.label}</span>
                            </div>
                            <button
                                onClick={() => setCurrentWeekIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentWeekIndex === 0}
                                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <button
                            onClick={handleDownloadMaster}
                            disabled={downloading}
                            className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                        >
                            {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                            Generate Master Report
                        </button>
                    </div>
                </div>

                {/* Master Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                            <Users className="w-12 h-12 text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Total Participants</p>
                        <h2 className="text-4xl font-black">{currentWeek.users.length}</h2>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-12 h-12 text-emerald-400" />
                        </div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Platform Turnover</p>
                        <h2 className="text-4xl font-black">₹{currentWeek.totalTurnover.toLocaleString()}</h2>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                            <Wallet className="w-12 h-12 text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Admin Capital Yield</p>
                        <h2 className="text-4xl font-black text-emerald-400">₹{currentWeek.totalAdminYield.toLocaleString()}</h2>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                            <Zap className="w-12 h-12 text-purple-400" />
                        </div>
                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">Sub-Admin Net Yield</p>
                        <h2 className="text-4xl font-black text-purple-400">₹{currentWeek.subAdminRevenue.toLocaleString()}</h2>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                            <Trophy className="w-12 h-12 text-amber-400" />
                        </div>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">Elite Earner</p>
                        <h2 className="text-2xl font-black whitespace-nowrap overflow-hidden text-ellipsis italic">
                            {currentWeek.users[0]?.name || 'N/A'}
                        </h2>
                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            ₹{currentWeek.users[0]?.stats.netWorth.toLocaleString() || 0} Net Profit
                        </p>
                    </div>
                </div>

                {/* Match Financial Audit Log */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <FileText className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-0.5">Match Financial Audit</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Match-by-Match Revenue Attribution</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {currentWeek.matchReports?.length || 0} Matches Audited
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[2.5rem] border border-white/5 bg-slate-900/50 backdrop-blur-3xl overflow-hidden">
                        <div className="overflow-x-auto min-w-full inline-block align-middle">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/5 bg-slate-950/20">
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Match Identity</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Enrolled</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Gross Turnover</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Admin Take (Net)</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Sub-Admin Cut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentWeek.matchReports?.map((m: any, i: number) => (
                                        <motion.tr
                                            key={m.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                                        >
                                            <td className="px-8 py-6">
                                                <div>
                                                    <div className="font-black text-lg group-hover:text-indigo-400 transition-colors uppercase tracking-tighter italic whitespace-nowrap">{m.name}</div>
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                        {new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} &middot; {m.venue}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-950/50 border border-white/5 font-black text-xs text-slate-400 italic">
                                                    {m.enrolled} Slots
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-xl text-white tracking-tighter">₹{m.turnover.toLocaleString()}</div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="font-black text-xl text-emerald-400 tracking-tighter">₹{m.adminTake.toLocaleString()}</div>
                                                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Platform Yield</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="font-black text-xl text-purple-400 tracking-tighter">₹{m.subAdminCut.toLocaleString()}</div>
                                                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Network Allocation</p>
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {(!currentWeek.matchReports || currentWeek.matchReports.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center opacity-20">
                                                <p className="text-sm font-black uppercase tracking-[0.5em]">No Match Activity Recorded</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Players List */}
                <div className="rounded-[2.5rem] bg-slate-950/40 border border-white/5 overflow-hidden backdrop-blur-xl">
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                            <FileText className="w-6 h-6 text-indigo-400" />
                            Player Breakdown
                        </h3>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordered by Net P&L</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-slate-950/20">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Operational Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Economic Activity</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Net Weekly Earnings</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="wait">
                                    {currentWeek.users.map((u: any, i: number) => {
                                        const isExpanded = expandedUserId === u.userId;
                                        return (
                                            <React.Fragment key={u.userId}>
                                                <motion.tr
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    onClick={() => setExpandedUserId(isExpanded ? null : u.userId)}
                                                    className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer ${isExpanded ? 'bg-white/[0.05]' : ''}`}
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border font-black text-xs transition-all ${i < 3 ? 'text-amber-500 border-amber-500/20' : 'text-slate-500 border-white/5 group-hover:border-white/20'}`}>
                                                            {i + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 overflow-hidden flex items-center justify-center shadow-inner">
                                                                {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-slate-700" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-lg group-hover:text-indigo-400 transition-colors uppercase tracking-tighter italic">{u.name}</div>
                                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-6">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Turnover</p>
                                                                <p className="text-xl font-black text-white">₹{u.stats.turnover.toLocaleString()}</p>
                                                            </div>
                                                            <div className="w-px h-8 bg-white/5" />
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                                                                <p className="text-sm font-black whitespace-nowrap">
                                                                    <span className="text-emerald-500">{u.stats.wins}W</span>
                                                                    <span className="text-slate-500 mx-1">/</span>
                                                                    <span className="text-rose-500">{u.stats.losses}L</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <div className="inline-flex items-center gap-6">
                                                            <div className="inline-flex flex-col items-end">
                                                                <span className={`text-2xl font-black tracking-tighter ${u.stats.netWorth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                    {u.stats.netWorth >= 0 ? '+' : ''}₹{u.stats.netWorth.toLocaleString()}
                                                                </span>
                                                                <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${u.stats.netWorth >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                                                                    {u.stats.netWorth >= 0 ? 'Gross Profit' : 'Gross Loss'}
                                                                </div>
                                                            </div>
                                                            <div className={`p-2 rounded-xl bg-white/5 border border-white/5 transition-transform ${isExpanded ? 'rotate-180 text-indigo-400' : 'text-slate-500 group-hover:text-white'}`}>
                                                                <ChevronDown className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </motion.tr>

                                                {/* Expanded Section */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.tr
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="bg-slate-900/40"
                                                        >
                                                            <td colSpan={4} className="px-8 py-10">
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                                                    {/* Match Evidence */}
                                                                    <div className="space-y-6">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
                                                                                <Activity className="w-3 h-3" /> Match Activity Log
                                                                            </h4>
                                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{u.matches.length} Operations Found</span>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            {u.matches.map((m: any, mi: number) => (
                                                                                <div key={mi} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                                                                    <div>
                                                                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                                                                            {new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' })} &middot; {m.venue}
                                                                                        </p>
                                                                                        <p className="font-black text-sm uppercase tracking-tighter">
                                                                                            {m.runs} Runs <span className="text-slate-500 font-normal text-xs ml-1">({m.balls} balls)</span>
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="font-black text-[10px] text-slate-500 uppercase tracking-widest mb-1">{m.outcome}</p>
                                                                                        <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[7px] font-black uppercase text-indigo-400 tracking-widest">
                                                                                            Turnover Audited
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Net Wealth Movement */}
                                                                    <div className="space-y-6">
                                                                        <div className="flex items-center justify-between">
                                                                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 flex items-center gap-2">
                                                                                <TrendingUp className="w-3 h-3" /> Net Wealth Movement
                                                                            </h4>
                                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aggregate Calculated</span>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <div className="p-10 bg-indigo-500/5 rounded-[2.5rem] border border-indigo-500/10 flex flex-col items-center text-center">
                                                                                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-6">
                                                                                    <Wallet className="w-8 h-8 text-indigo-400" />
                                                                                </div>
                                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3">Total Weekly P&L</p>
                                                                                <h5 className={`text-5xl font-black italic tracking-tighter ${u.stats.netWorth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                                    {u.stats.netWorth >= 0 ? '+' : ''}₹{u.stats.netWorth.toLocaleString()}
                                                                                </h5>
                                                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-4 italic">
                                                                                    Based on all tournament transactions in this cycle
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 bg-white/[0.02] border-t border-white/5 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Final Aggregate Summaries Prepared</p>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function AdminReportsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
                <Spinner />
            </div>
        }>
            <ReportsContent />
        </Suspense>
    );
}
