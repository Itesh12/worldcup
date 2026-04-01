"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Activity, TrendingUp, AlertTriangle, X, ArrowUpRight, IndianRupee, Clock, Search, ShieldAlert, BarChart3, Radio, Database, Trash2, ArrowRight, Swords } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { LiveScoreGrid } from "@/components/dashboard/LiveScoreGrid";

interface AnalyticsData {
    actionDesk: {
        pendingWithdrawals: { count: number; amount: number };
        liveMatches: { _id: string; teams: any[]; startTime: string; status: string; liveScore?: any; matchDesc?: string; seriesName?: string }[];
        dailyFinancials: { deposits: number; withdrawals: number };
        todayMatchStats: { matchCount: number; arenaCount: number; totalSlots: number; filledSlots: number };
    };
    financialRisk: {
        totalSystemLiability: number;
        whales: { _id: string; name: string; email: string; walletBalance: number; image?: string }[];
        highValueInteractions: any[];
        liquidityScore: number;
    };
    ecosystem: {
        topSubAdmins: { _id: string; totalCommissionEarned: number; subAdminId: { name: string; email: string } }[];
        globalFillRate: number;
        totalUsers: number;
        growth: { reg24h: number; reg7d: number };
    };
    intelligence: {
        tournamentStats: { name: string; matchCount: number; userCount: number }[];
    };
    auditFeed: any[];
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);

    // Reset Modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetConfirmation, setResetConfirmation] = useState("");
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
        if (status === "authenticated") {
            if ((session?.user as any)?.role !== "admin") {
                router.push("/dashboard");
                return;
            }
            // Only fetch once or if data is missing to prevent flickers on session refresh
            if (!data) {
                fetchAnalytics();
            }
        }
    }, [status, session, data]);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("/api/admin/analytics");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetDatabase = async () => {
        setResetting(true);
        try {
            const res = await fetch("/api/admin/reset-db", { method: "POST" });
            const json = await res.json();

            if (res.ok) {
                showToast("Database Reset Successfully!", "success");
                window.location.reload();
            } else {
                showToast("Reset Failed: " + (json.error || "Unknown error"), "error");
                setResetting(false);
            }
        } catch (error) {
            console.error(error);
            showToast("An error occurred during reset.", "error");
            setResetting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-[60vh] items-center justify-center gap-4">
                <Spinner />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing Command Center...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Database Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
                    <div className="relative w-full max-w-lg bg-[#0f172a] border border-red-500/30 rounded-[2rem] p-8 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

                        <button
                            onClick={() => setShowResetModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-6 shadow-lg shadow-red-500/10">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Nuclear Option</h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm mb-8">
                                You are about to wipe the entire database. This deletes matches, user stats, and assignments. Admin accounts will be preserved.
                            </p>

                            <div className="w-full bg-red-950/20 border border-red-500/20 rounded-xl p-4 mb-6">
                                <label className="block text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 text-left">
                                    Type "RESET" to confirm
                                </label>
                                <input
                                    type="text"
                                    value={resetConfirmation}
                                    onChange={(e) => setResetConfirmation(e.target.value.toUpperCase())}
                                    placeholder="RESET"
                                    className="w-full bg-slate-900 border border-red-500/30 rounded-lg px-4 py-3 text-white font-black tracking-[0.2em] placeholder:text-slate-700 focus:outline-none focus:border-red-500 text-center uppercase"
                                />
                            </div>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all uppercase tracking-wider text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetDatabase}
                                    disabled={resetConfirmation !== "RESET" || resetting}
                                    className="flex-1 py-4 rounded-xl bg-red-600 text-white font-black hover:bg-red-500 transition-all uppercase tracking-wider text-xs shadow-lg shadow-red-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {resetting ? "Wiping..." : "Confirm Wipe"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 py-4 md:py-6">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                            <Radio className="w-6 h-6 text-indigo-500" /> Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Center</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl backdrop-blur-md transition-all">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]" />
                            <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em]">Oversight Live</span>
                        </div>
                        <div className="hidden lg:flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-xl backdrop-blur-md transition-all">
                            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Crons Active</span>
                        </div>
                        <Link
                            href="/dashboard?view=player"
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                            Player View
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-8 pb-24 lg:pb-12 space-y-8">
                
                {/* LIVE SCORES GRID */}
                <LiveScoreGrid initialMatches={data.actionDesk.liveMatches} role="admin" />

                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em]">Phase 1: Action Desk</h2>
                </div>

                {/* ACTION DESK - Top Tier Operations */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Primary Action: Withdrawals */}
                    <div className="relative overflow-hidden rounded-[24px] p-6 md:p-8 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl group hover:border-amber-400 transition-all flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                    <IndianRupee className="w-6 h-6 text-amber-500" />
                                </div>
                                {data.actionDesk.pendingWithdrawals.count > 0 && (
                                    <span className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                                        Action Required
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pending Withdrawals Queue</p>
                            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                                {data.actionDesk.pendingWithdrawals.count} <span className="text-lg text-slate-500">Reqs</span>
                            </h2>
                            <p className="text-sm font-black text-amber-500 tabular-nums">Totaling ₹{data.actionDesk.pendingWithdrawals.amount.toLocaleString()}</p>
                        </div>
                        <Link href="/admin/withdrawals" className="mt-8 flex items-center justify-between bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 px-5 py-3 rounded-xl transition-all group/btn">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Process Payouts</span>
                            <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Secondary Action: Matches Oversights */}
                    <div className="relative overflow-hidden rounded-[24px] p-6 md:p-8 bg-slate-900 border border-white/10 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    <Activity className="w-6 h-6 text-indigo-400" />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Live Match Control</p>
                            {data.actionDesk.liveMatches.length > 0 ? (
                                <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                                    {data.actionDesk.liveMatches.length} <span className="text-lg text-indigo-400">Live</span>
                                </h2>
                            ) : (
                                <h2 className="text-3xl font-black text-slate-600 tracking-tighter mb-2 italic">Standby Mode</h2>
                            )}
                        </div>
                        <Link href="/admin/matches" className="mt-8 flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-xl transition-all group/btn">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Manage Calendar</span>
                            <ArrowRight className="w-4 h-4 text-white group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Operational Awareness: Daily Flow */}
                    <div className="relative overflow-hidden rounded-[24px] p-6 md:p-8 bg-slate-900 border border-white/10 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                                </div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-1 rounded bg-white/5">Today</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Today's Daily Flow</p>
                            
                            <div className="space-y-4 mt-4">
                                <div>
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1.5">
                                        <span className="text-emerald-400">Deposits</span>
                                        <span className="text-white tabular-nums">₹{data.actionDesk.dailyFinancials.deposits.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest mb-1.5">
                                        <span className="text-amber-400">Withdrawals</span>
                                        <span className="text-white tabular-nums">₹{data.actionDesk.dailyFinancials.withdrawals.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: data.actionDesk.dailyFinancials.deposits > 0 ? `${Math.min((data.actionDesk.dailyFinancials.withdrawals / data.actionDesk.dailyFinancials.deposits) * 100, 100)}%` : '0%' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-2 mt-10">
                    <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em]">Phase 1.5: Today's Match Operations</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                <Database className="w-5 h-5 text-indigo-400" />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Today's Matches</h3>
                        <div className="text-2xl font-black text-white tracking-tighter">
                            {data.actionDesk.todayMatchStats.matchCount} <span className="text-xs text-slate-500 uppercase">Scheduled</span>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                                <Swords className="w-5 h-5 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Active Arenas</h3>
                        <div className="text-2xl font-black text-white tracking-tighter">
                            {data.actionDesk.todayMatchStats.arenaCount} <span className="text-xs text-slate-500 uppercase">Live</span>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 p-6 rounded-3xl backdrop-blur-xl flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-3">
                            <div>
                                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Today's Saturation</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">
                                    {data.actionDesk.todayMatchStats.filledSlots} / {data.actionDesk.todayMatchStats.totalSlots} Slots Occupied
                                </p>
                            </div>
                            <span className="text-xs font-black text-indigo-400">
                                {data.actionDesk.todayMatchStats.totalSlots > 0 
                                    ? ((data.actionDesk.todayMatchStats.filledSlots / data.actionDesk.todayMatchStats.totalSlots) * 100).toFixed(1)
                                    : 0}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" 
                                style={{ width: `${data.actionDesk.todayMatchStats.totalSlots > 0 ? (data.actionDesk.todayMatchStats.filledSlots / data.actionDesk.todayMatchStats.totalSlots) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

                <div className="flex items-center justify-between mb-4 mt-6">
                    <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em]">Phase 2: Risk & Ecosystem</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Financial Liability (Massive Risk Metric) */}
                    <div className="lg:col-span-1 rounded-[24px] bg-red-950/20 border border-red-500/20 p-6 md:p-8 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldAlert className="w-6 h-6 text-red-500" />
                                <h3 className="text-sm font-black text-white tracking-widest uppercase">System Liability</h3>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tighter tabular-nums truncate">₹{data.financialRisk.totalSystemLiability.toLocaleString()}</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">Total platform liability to users.</p>
                            
                            <div className="mt-6 pt-6 border-t border-white/5">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidity Coverage</span>
                                    <span className={`text-[10px] font-black uppercase ${data.financialRisk.liquidityScore >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {data.financialRisk.liquidityScore.toFixed(2)}x
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${data.financialRisk.liquidityScore >= 1 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(data.financialRisk.liquidityScore * 50, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-4 bg-white/5 py-1 px-3 rounded inline-block">Whale Tracker</h4>
                            <div className="space-y-3">
                                {data.financialRisk.whales.map((whale, idx) => (
                                    <div key={whale._id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-xs font-bold text-white truncate">{whale.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-red-400 tabular-nums">₹{whale.walletBalance.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Ecosystem & Platform Health */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-[24px] bg-slate-900 border border-white/10 p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xs font-black text-indigo-400 tracking-widest uppercase mb-6 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" /> Platform Utilization
                                </h3>
                                <div className="mb-4">
                                    <h2 className="text-4xl font-black text-white">{data.ecosystem.globalFillRate.toFixed(1)}%</h2>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Global Arena Fill Rate</p>
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${data.ecosystem.globalFillRate}%` }} />
                                </div>
                            </div>
                            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
                                    <p className="text-2xl font-black text-white">{data.ecosystem.totalUsers.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Growth Index</p>
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm font-black text-white">+{data.ecosystem.growth.reg24h}<span className="text-[10px] text-slate-500 ml-1">24H</span></div>
                                        <div className="text-sm font-black text-white">+{data.ecosystem.growth.reg7d}<span className="text-[10px] text-slate-500 ml-1">7D</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SubAdmin Leaderboard */}
                        <div className="rounded-[24px] bg-slate-900 border border-white/10 p-6 flex flex-col">
                            <h3 className="text-xs font-black text-purple-400 tracking-widest uppercase mb-6 flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Franchise Leaderboard
                            </h3>
                            <div className="space-y-3 flex-1">
                                {data.ecosystem.topSubAdmins.length > 0 ? data.ecosystem.topSubAdmins.map((admin, idx) => (
                                    <div key={admin._id} className="flex items-center gap-4 bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs border border-purple-500/20">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-white truncate">{admin.subAdminId.name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Franchise</p>
                                        </div>
                                        <span className="text-xs font-black text-emerald-400">₹{admin.totalCommissionEarned.toLocaleString()}</span>
                                    </div>
                                )) : (
                                    <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-600 uppercase">No Data Generated</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em]">Phase 2.5: Intelligence Hub</h2>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                            Global Series Tracking
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3 rounded-[24px] bg-slate-900 border border-white/10 p-6 flex flex-col">
                            <h3 className="text-xs font-black text-indigo-400 tracking-widest uppercase mb-6 flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Active Tournaments Performance
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-4">Series Name</th>
                                            <th className="px-6 py-4">Total Matches</th>
                                            <th className="px-6 py-4">Unique Players</th>
                                            <th className="px-6 py-4">Engagement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(data as any).intelligence?.tournamentStats?.map((t: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-white text-xs">{t.name}</td>
                                                <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">{t.matchCount}</td>
                                                <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">{t.userCount}</td>
                                                <td className="px-6 py-4">
                                                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min((t.userCount / 50) * 100, 100)}%` }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phase 3: Live Audit Feed */}
                <div className="mt-12">
                    <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em] mb-6">Phase 3: Real-Time Audit Feed</h2>
                    <div className="bg-slate-900 border border-white/10 rounded-[24px] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date/Time</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.auditFeed.map((tx, i) => (
                                        <tr key={tx._id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-xs font-bold text-white">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold">
                                                        {tx.userId?.name?.[0] || "?"}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-300">{tx.userId?.name || "Unknown User"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-white uppercase tracking-wider">{tx.type}</span>
                                            </td>
                                            <td className="px-6 py-4 font-mono">
                                                <span className={`text-xs font-black ${
                                                    tx.type === 'withdrawal' ? 'text-amber-400' :
                                                    tx.type === 'deposit' ? 'text-emerald-400' : 'text-slate-300'
                                                }`}>
                                                    {tx.type === 'withdrawal' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                                                    tx.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    tx.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                    'bg-red-500/10 border-red-500/20 text-red-400'
                                                }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Nuclear Reset - Kept at bottom */}
                <div className="mt-20 pt-10 border-t border-red-500/20 flex justify-end">
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Wipe Entire Database
                    </button>
                </div>
            </div>
        </div>
    );
}
