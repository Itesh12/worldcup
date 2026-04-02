"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Activity, TrendingUp, AlertTriangle, X, ArrowUpRight, IndianRupee, Clock, Search, ShieldAlert, BarChart3, Radio, Database, Trash2, ArrowRight, Swords, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { LiveScoreGrid } from "@/components/dashboard/LiveScoreGrid";
import { CreateArenaModal } from "@/components/dashboard/CreateArenaModal";

interface AnalyticsData {
    actionDesk: {
        pendingWithdrawals: { count: number; amount: number };
        liveMatches: { _id: string; teams: any[]; startTime: string; status: string; liveScore?: any; matchDesc?: string; seriesName?: string }[];
        dailyFinancials: { deposits: number; withdrawals: number };
        todayMatchStats: { matchCount: number; arenaCount: number; totalSlots: number; filledSlots: number };
        missedOpportunities: { _id: string; teams: any[]; startTime: string }[];
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

    // Arena Creation
    const [selectedMatchForArena, setSelectedMatchForArena] = useState<any | null>(null);

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

            {/* Unified Command Center Header is now at Layout Level */}

            <div className="max-w-[1600px] mx-auto px-4 md:px-10 py-8 pb-10 lg:pb-12 space-y-12">

                {/* LIVE SCORES GRID */}
                <LiveScoreGrid initialMatches={data.actionDesk.liveMatches} role="admin" />

                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                        <Zap className="w-5 h-5 text-indigo-400" /> System <span className="text-indigo-400 font-black">Operations</span>
                    </h2>
                </div>

                {/* ACTION DESK - Top Tier Operations */}
                <div className="space-y-6">
                    {/* UNHOSTED MATCHES - High Density Overlay */}
                    <AnimatePresence>
                        {data.actionDesk.missedOpportunities?.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/20">
                                            <AlertTriangle className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-tight">Oversight Alert</h3>
                                            <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest">{data.actionDesk.missedOpportunities.length} Unhosted Matches Today</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {data.actionDesk.missedOpportunities.map(m => (
                                            <button
                                                key={m._id}
                                                onClick={() => setSelectedMatchForArena(m)}
                                                className="group flex items-center gap-3 bg-black/40 border border-white/5 hover:border-red-500/30 rounded-xl px-4 py-2 transition-all"
                                            >
                                                <span className="text-[9px] font-black text-white uppercase">{m.teams[0].shortName || m.teams[0].name} v {m.teams[1].shortName || m.teams[1].name}</span>
                                                <div className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black uppercase rounded shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">HOST</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Primary Action: Withdrawals */}
                        <div className="relative overflow-hidden rounded-3xl p-5 bg-slate-900 border border-white/10 shadow-2xl group hover:border-amber-500/30 transition-all flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-[40px] rounded-full pointer-events-none" />
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-500">
                                        <IndianRupee className="w-4 h-4" />
                                    </div>
                                    {data.actionDesk.pendingWithdrawals.count > 0 && (
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 shadow-md">
                                            Action Required
                                        </span>
                                    )}
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Withdrawals Queue</p>
                                <h2 className="text-3xl font-black text-white tracking-tighter tabular-nums truncate">
                                    {data.actionDesk.pendingWithdrawals.count} <span className="text-base text-slate-500 font-bold not-italic ml-1">Reqs</span>
                                </h2>
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-1">Totaling ₹{data.actionDesk.pendingWithdrawals.amount.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Secondary Action: Matches Oversights */}
                        <div className="relative overflow-hidden rounded-3xl p-5 bg-slate-900 border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                                        <Activity className="w-4 h-4 text-indigo-400" />
                                    </div>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Match Control</p>
                                {data.actionDesk.liveMatches.length > 0 ? (
                                    <h2 className="text-3xl font-black text-white tracking-tighter tabular-nums leading-none">
                                        {data.actionDesk.liveMatches.length} <span className="text-base text-indigo-400 font-bold not-italic ml-1">Live</span>
                                    </h2>
                                ) : (
                                    <h2 className="text-2xl font-black text-slate-600 tracking-tighter italic">Standby</h2>
                                )}
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Active Monitoring</p>
                            </div>
                        </div>

                        {/* Operational Awareness: Daily Flow */}
                        <div className="relative overflow-hidden rounded-3xl p-5 bg-slate-900 border border-white/10 shadow-2xl flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                            <div>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">Intraday</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Today's Daily Flow</p>

                                <div className="space-y-3 mt-2">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                            <span className="text-emerald-400">Deposits</span>
                                            <span className="text-white tabular-nums">₹{data.actionDesk.dailyFinancials.deposits.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                            <span className="text-amber-400">Withdrawals</span>
                                            <span className="text-white tabular-nums">₹{data.actionDesk.dailyFinancials.withdrawals.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500 rounded-full" style={{ width: data.actionDesk.dailyFinancials.deposits > 0 ? `${Math.min((data.actionDesk.dailyFinancials.withdrawals / data.actionDesk.dailyFinancials.deposits) * 100, 100)}%` : '0%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 mt-2">
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                        <Swords className="w-5 h-5 text-purple-400" /> Match <span className="text-purple-400 font-black">Intelligence</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl backdrop-blur-xl group hover:border-indigo-500/30 transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                <Database className="w-4 h-4 text-indigo-400" />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Total Scheduled</h3>
                        <div className="text-2xl font-black text-white tracking-tighter">
                            {data.actionDesk.todayMatchStats.matchCount} <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">Events</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl backdrop-blur-xl group hover:border-purple-500/30 transition-all">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                <Swords className="w-4 h-4 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Active Hosting</h3>
                        <div className="text-2xl font-black text-white tracking-tighter">
                            {data.actionDesk.todayMatchStats.arenaCount} <span className="text-[10px] text-slate-500 uppercase font-bold ml-1">Arenas</span>
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-slate-900 border border-white/5 p-4 rounded-2xl backdrop-blur-xl flex flex-col justify-center group hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <h3 className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Overall Saturation</h3>
                                <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                                    {data.actionDesk.todayMatchStats.filledSlots} of {data.actionDesk.todayMatchStats.totalSlots} Slots
                                </p>
                            </div>
                            <span className="text-[10px] font-black text-emerald-400">
                                {data.actionDesk.todayMatchStats.totalSlots > 0
                                    ? ((data.actionDesk.todayMatchStats.filledSlots / data.actionDesk.todayMatchStats.totalSlots) * 100).toFixed(1)
                                    : 0}%
                            </span>
                        </div>
                        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
                                style={{ width: `${data.actionDesk.todayMatchStats.totalSlots > 0 ? (data.actionDesk.todayMatchStats.filledSlots / data.actionDesk.todayMatchStats.totalSlots) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />

                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-500" /> Financial <span className="text-red-500 font-black">Risk</span> & Growth
                    </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Financial Liability */}
                    <div className="lg:col-span-1 rounded-2xl bg-slate-900 border border-white/10 p-5 md:p-6 flex flex-col justify-between relative overflow-hidden group hover:border-red-500/30 transition-all">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="w-4 h-4 text-red-500" />
                                <h3 className="text-[10px] font-black text-white tracking-[0.2em] uppercase">System Liability</h3>
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tighter tabular-nums truncate">₹{data.financialRisk.totalSystemLiability.toLocaleString()}</h2>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 leading-relaxed italic">Total User Obligations</p>

                            <div className="mt-6 pt-4 border-t border-white/5">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidity Score</span>
                                    <span className={`text-[10px] font-black uppercase ${data.financialRisk.liquidityScore >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {data.financialRisk.liquidityScore.toFixed(2)}x Coverage
                                    </span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${data.financialRisk.liquidityScore >= 1 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}
                                        style={{ width: `${Math.min(data.financialRisk.liquidityScore * 50, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ecosystem & Platform Health */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                            <div>
                                <h3 className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" /> Usage Index
                                </h3>
                                <div className="mb-3">
                                    <h2 className="text-3xl font-black text-white tracking-tighter">{data.ecosystem.globalFillRate.toFixed(1)}%</h2>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Platform Fill Rate</p>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all shadow-[0_0_10px_#6366f1]" style={{ width: `${data.ecosystem.globalFillRate}%` }} />
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Global Users</p>
                                    <p className="text-xl font-black text-white tracking-tighter">{data.ecosystem.totalUsers.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Growth (7D)</p>
                                    <div className="flex items-center gap-2 text-xl font-black text-white tracking-tighter">
                                        +{data.ecosystem.growth.reg7d}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SubAdmin Leaderboard */}
                        <div className="rounded-2xl bg-slate-900 border border-white/10 p-5 flex flex-col group hover:border-purple-500/30 transition-all">
                            <h3 className="text-[10px] font-black text-purple-400 tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                                <Trophy className="w-4 h-4" /> Master Franchisees
                            </h3>
                            <div className="space-y-2 flex-1">
                                {data.ecosystem.topSubAdmins.length > 0 ? data.ecosystem.topSubAdmins.map((admin, idx) => (
                                    <div key={admin._id} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/5 transition-colors group/item">
                                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-black text-[9px] border border-purple-500/20 group-hover/item:bg-purple-500 group-hover/item:text-white transition-all">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{admin.subAdminId?.name || "Deleted Franchise"}</p>
                                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest italic">{admin.subAdminId?.email?.split('@')[0] || "---"}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-emerald-400 block tracking-tighter">₹{admin.totalCommissionEarned.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="h-full flex items-center justify-center text-[9px] font-black text-slate-600 uppercase">Awaiting Data</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-black text-white/50 uppercase tracking-[0.3em]">Intelligence Hub</h2>
                        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                            Global Analytics
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3 rounded-2xl bg-slate-900 border border-white/10 p-6 flex flex-col group hover:border-indigo-500/30 transition-all">
                            <h3 className="text-[10px] font-black text-indigo-400 tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Series Performance Matrix
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-5 py-4">Tournament Entity</th>
                                            <th className="px-5 py-4">Event Count</th>
                                            <th className="px-5 py-4">User Reach</th>
                                            <th className="px-5 py-4">Platform Impact</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {(data as any).intelligence?.tournamentStats?.map((t: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-all group/row">
                                                <td className="px-5 py-3.5 font-black text-white text-[10px] uppercase tracking-tight">{t.name}</td>
                                                <td className="px-5 py-3.5 text-[10px] font-bold text-slate-400 tabular-nums uppercase">{t.matchCount} Matches</td>
                                                <td className="px-5 py-3.5 text-[10px] font-bold text-slate-400 tabular-nums uppercase">{t.userCount} Players</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" style={{ width: `${Math.min((t.userCount / 50) * 100, 100)}%` }} />
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

                <div className="mt-12">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                            <Database className="w-4 h-4 text-slate-500" /> Audit <span className="text-slate-500 font-black">Ledger</span>
                        </h2>
                    </div>
                    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden group hover:border-slate-500/30 transition-all">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Entity</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Operation</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-[10px]">
                                    {data.auditFeed.map((tx, i) => (
                                        <tr key={tx._id} className="hover:bg-white/5 transition-all group/row">
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <div className="font-black text-white uppercase tracking-tight">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono mt-0.5">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[9px] font-black border border-indigo-500/20">
                                                        {tx.userId?.name?.[0] || "?"}
                                                    </div>
                                                    <span className="font-black text-slate-300 uppercase tracking-tight truncate max-w-[120px]">{tx.userId?.name || "Anonymous"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="font-black text-white uppercase tracking-widest italic">{tx.type}</span>
                                            </td>
                                            <td className="px-6 py-3.5 font-mono">
                                                <span className={`font-black ${tx.type === 'withdrawal' ? 'text-amber-400' :
                                                    tx.type === 'deposit' ? 'text-emerald-400' : 'text-slate-300'
                                                    }`}>
                                                    {tx.type === 'withdrawal' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border shadow-sm ${tx.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
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
                <div className="mt-8 pt-6 border-t border-red-500/20 flex justify-end">
                    <button
                        onClick={() => setShowResetModal(true)}
                        className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" /> Wipe Entire Database
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {selectedMatchForArena && (
                    <CreateArenaModal
                        isOpen={!!selectedMatchForArena}
                        onClose={() => setSelectedMatchForArena(null)}
                        matchId={selectedMatchForArena._id}
                        matchName={`${selectedMatchForArena.teams[0].shortName || selectedMatchForArena.teams[0].name} vs ${selectedMatchForArena.teams[1].shortName || selectedMatchForArena.teams[1].name}`}
                        onSuccess={() => {
                            setSelectedMatchForArena(null);
                            fetchAnalytics();
                            showToast("Official Arena Launched!", "success");
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
