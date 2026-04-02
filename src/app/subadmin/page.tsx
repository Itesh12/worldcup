"use client";

import React, { useEffect, useState } from "react";
import { Users, Swords, IndianRupee, PieChart, RefreshCw, Trophy, ArrowUpRight, Zap, Target, Share2, AlertTriangle, Lightbulb, Copy, UserPlus, FileText, Clock, Database, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import ArenaManager from "@/components/shared/ArenaManager";
import { CreateArenaModal } from "@/components/dashboard/CreateArenaModal";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { LiveScoreGrid } from "@/components/dashboard/LiveScoreGrid";

interface Stats {
    liveMatches: { _id: string; teams: any[]; startTime: string; status: string; liveScore?: any; matchDesc?: string; seriesName?: string }[];
    gamification: {
        brandName: string;
        commissionPercentage: number;
        totalCommissionEarned: number;
        currentTier: string;
        nextTierThreshold: number | null;
    };
    alerts: {
        needsPromotion: { _id: string; name: string; entryFee: number; fillRate: number; hoursUntilStart: number }[];
        missedOpportunities: { _id: string; teams: any[]; startTime: string }[];
    };
    intelligence: {
        playerNetworkSize: number;
        newPlayers7d: number;
        networkVips: { _id: string; name: string; email: string; walletBalance: number; image?: string }[];
        pendingPayoutPipeline: number;
        bestEntryFee: number;
        todayPerformance: { 
            matchCount: number;
            arenaCount: number;
            totalSlots: number;
            filledSlots: number;
            projectedCommission: number;
        };
    };
    recentArenas: any[];
}

export default function SubAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const { showToast } = useToast();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedMatchForArena, setSelectedMatchForArena] = useState<any>(null);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/subadmin/stats");
            const data = await res.json();
            if (res.ok) {
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
            showToast("Failed to refresh dashboard stats.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
        if (status === "authenticated") {
            if ((session?.user as any)?.role !== "subadmin") {
                router.push("/dashboard");
                return;
            }
            // Only fetch once to prevent global dashboard reload flashes
            if (!stats) {
                fetchStats();
            }
        }
    }, [status, session, stats]);

    const handleCopyPromo = (arena: any) => {
        const message = `🔥 *${arena.name}* is starting in less than ${arena.hoursUntilStart} hours!\n\n💸 Entry Fee: ₹${arena.entryFee}\n⭐ Only ${100 - arena.fillRate}% spots left!\n\n👉 Join Now: ${window.location.origin}/dashboard`;
        navigator.clipboard.writeText(message);
        showToast("Promo Message Copied to Clipboard!", "success");
    };

    const handleCopyInviteLink = () => {
        const inviteLink = `${window.location.origin}/register?ref=${(session?.user as any)?.id}`;
        navigator.clipboard.writeText(inviteLink);
        showToast("Personal Invitation Link Copied!", "success");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing Marketing Suite...</p>
            </div>
        );
    }

    if (!stats) return null;

    const { gamification, alerts, intelligence, recentArenas } = stats;

    const tierColors = {
        Bronze: "text-amber-600 bg-amber-600/10 border-amber-600/20 shadow-amber-600/20",
        Silver: "text-slate-300 bg-slate-300/10 border-slate-300/20 shadow-slate-300/20",
        Gold: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-yellow-400/20",
        Diamond: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 shadow-cyan-400/20"
    };

    const activeColor = tierColors[gamification.currentTier as keyof typeof tierColors] || tierColors.Bronze;
    const progressPercent = gamification.nextTierThreshold 
        ? Math.min((gamification.totalCommissionEarned / gamification.nextTierThreshold) * 100, 100) 
        : 100;

    return (
        <div className="p-4 md:p-10 space-y-10 max-w-[1600px] mx-auto pb-24 lg:pb-12 animate-in fade-in duration-700">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                        {gamification.brandName?.toLowerCase().includes('franchise') 
                            ? gamification.brandName 
                            : <>{gamification.brandName} <span className="text-indigo-500">Franchise</span></>
                        }
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className={`px-2 py-0.5 border rounded text-[9px] font-black uppercase tracking-widest ${activeColor}`}>
                            {gamification.currentTier} Level
                        </div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest hidden sm:block">
                            HQ • Marketing & Growth Analytics
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchStats}
                        className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all group"
                    >
                        <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                    <Link 
                        href="/dashboard?view=player"
                        className="hidden sm:flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:border-indigo-500 text-indigo-300 hover:text-white px-5 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest"
                    >
                        Player View
                    </Link>
                    <Link 
                        href="/subadmin/arenas/new"
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest"
                    >
                        Host Match
                    </Link>
                </div>
            </div>

            {/* LIVE SCORES GRID */}
            <LiveScoreGrid initialMatches={stats.liveMatches} role="subadmin" />

            {/* Today's Focus Action Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                        <Zap className="w-5 h-5 text-yellow-400" /> Today's <span className="text-yellow-400 font-black">Performance</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl backdrop-blur-xl group hover:border-indigo-500/30 transition-all">
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Today's Matches</h3>
                        <div className="text-3xl font-black text-white tracking-tighter">
                            {intelligence.todayPerformance.matchCount} 
                            <span className="text-xs text-slate-500 uppercase ml-2">Total Events</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl backdrop-blur-xl group hover:border-purple-500/30 transition-all">
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">My Active Arenas</h3>
                        <div className="text-3xl font-black text-white tracking-tighter">
                            {intelligence.todayPerformance.arenaCount}
                            <span className="text-xs text-slate-500 uppercase ml-2">Hosted</span>
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-white/5 p-6 rounded-3xl backdrop-blur-xl group hover:border-emerald-500/30 transition-all flex flex-col justify-center">
                        <div className="flex justify-between items-end mb-3">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Saturation</h3>
                            <span className="text-xs font-black text-emerald-400">
                                {intelligence.todayPerformance.totalSlots > 0 
                                    ? ((intelligence.todayPerformance.filledSlots / intelligence.todayPerformance.totalSlots) * 100).toFixed(1)
                                    : 0}%
                            </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                                style={{ width: `${intelligence.todayPerformance.totalSlots > 0 ? (intelligence.todayPerformance.filledSlots / intelligence.todayPerformance.totalSlots) * 100 : 0}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl shadow-xl shadow-indigo-950/40 flex flex-col justify-between group hover:scale-[1.02] transition-all">
                        <h3 className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Today's Payout</h3>
                        <div className="text-4xl font-black text-white italic tracking-tighter">
                            ₹{intelligence.todayPerformance.projectedCommission.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. Gamification Hero - High Density */}
                <div className="lg:col-span-2 relative overflow-hidden rounded-2xl p-5 md:p-6 bg-slate-900 border border-white/10 shadow-2xl flex flex-col justify-center">
                    <div className={`absolute -right-20 -bottom-20 w-64 h-64 blur-[100px] rounded-full pointer-events-none opacity-20 ${activeColor.split(' ')[1]}`} />
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10 w-full mb-8">
                        <div>
                            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest mb-3 shadow-lg ${activeColor}`}>
                                <Target className="w-3.5 h-3.5" /> {gamification.currentTier} Level
                            </span>
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">Total Earnings Generated</p>
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter tabular-nums mt-1 leading-none">
                                ₹{gamification.totalCommissionEarned.toLocaleString()}
                            </h2>
                        </div>

                        <div className="w-full md:w-auto text-left md:text-right">
                            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Commission Rate</p>
                            <div className="text-2xl font-black text-white tabular-nums">
                                {gamification.commissionPercentage}<span className="text-indigo-400 text-lg">%</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 p-4 bg-black/40 border border-white/5 rounded-xl backdrop-blur-md w-full">
                        <div className="flex justify-between items-end mb-2.5">
                            <div>
                                <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Next Level Progress</h4>
                                {gamification.nextTierThreshold ? (
                                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                                        Bridge the <span className="text-indigo-400">₹{(gamification.nextTierThreshold - gamification.totalCommissionEarned).toLocaleString()}</span> gap to level up!
                                    </p>
                                ) : (
                                    <p className="text-[8px] font-bold text-cyan-400 uppercase mt-0.5">Max Level Achieved</p>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-white">{progressPercent.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${gamification.currentTier === 'Diamond' ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-indigo-500 shadow-[0_0_10px_#6366f1]'}`}
                                style={{ width: `${progressPercent}%` }} 
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Intelligence & Growth Panel */}
                <div className="flex flex-col gap-6">
                    <div className="flex-1 bg-slate-900 border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Network Size
                                </h3>
                                <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-md">
                                    +{intelligence.newPlayers7d} (7D)
                                </div>
                            </div>
                            <div className="text-3xl font-black text-white tracking-tighter tabular-nums mb-1">
                                {intelligence.playerNetworkSize} <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase">Active</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed italic">System Status: Healthy</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleCopyInviteLink}
                        className="bg-indigo-600 hover:bg-indigo-500 rounded-2xl p-5 text-left transition-all group flex flex-col gap-3 shadow-xl shadow-indigo-600/10 border border-white/5"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <div className="p-2 bg-white/20 rounded-xl">
                                <Share2 className="w-4 h-4 text-white" />
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-white/60 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-white text-xs font-black uppercase italic tracking-tight">Recruit Elite</h3>
                            <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest mt-0.5">Share Invitation Link</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Network VIPs (Phase 3) */}
            <div className="space-y-6">
                <h2 className="text-sm font-black text-white/50 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Franchise VIP Network
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {intelligence.networkVips?.map((vip, i) => (
                        <div key={vip._id} className="bg-slate-900 border border-white/5 p-5 rounded-[24px] flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
                            <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-black text-indigo-400 text-sm group-hover:bg-indigo-500/10 transition-colors">
                                {vip.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-white truncate">{vip.name}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1">Tier #{i+1} Asset</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-white tabular-nums">₹{vip.walletBalance.toLocaleString()}</p>
                                <div className="text-[9px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded mt-1">Active Player</div>
                            </div>
                        </div>
                    ))}
                    {(!intelligence.networkVips || intelligence.networkVips.length === 0) && (
                        <div className="lg:col-span-3 py-10 bg-slate-900/50 border border-white/5 border-dashed rounded-[24px] text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            No high-volume players detected yet.
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 3. Alerts & Promotion */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-black text-amber-500 italic uppercase tracking-tight flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5" /> Needs Promotion
                        </h2>
                    </div>

                    {alerts.needsPromotion.length > 0 ? (
                        <div className="space-y-4">
                            {alerts.needsPromotion.map((arena) => (
                                <div key={arena._id} className="bg-slate-900 border border-white/10 p-5 rounded-2xl group hover:border-amber-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-xs font-black text-white uppercase italic tracking-tight">{arena.name}</h3>
                                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                                <Clock className="w-3 h-3" /> {arena.hoursUntilStart} hrs left
                                            </span>
                                        </div>
                                        <div className="px-2 py-1 bg-amber-500/10 rounded text-[9px] font-black text-amber-500 border border-amber-500/20">
                                            {arena.fillRate}% Full
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleCopyPromo(arena)}
                                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                    >
                                        <Share2 className="w-3.5 h-3.5" /> 1-Click WhatsApp Copy
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-white/5 border-dashed p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-3 h-48">
                            <Trophy className="w-6 h-6 text-slate-700" />
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest leading-relaxed">No critical promos needed.</p>
                        </div>
                    )}

                    {/* UNHOSTED MATCHES - High Density Overlay */}
                    <AnimatePresence>
                        {alerts.missedOpportunities?.length > 0 && (
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
                                            <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest">{alerts.missedOpportunities.length} Unhosted Matches Today</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2">
                                        {alerts.missedOpportunities.map(m => (
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
                </div>

                {/* 4. Franchise Earnings Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                            <FileText className="w-5 h-5 text-indigo-400" /> Recent Arenas <span className="text-indigo-400">Ledger</span>
                        </h2>
                    </div>

                    <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr>
                                        <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Arena / Match</th>
                                        <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Metrics</th>
                                        <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Potential</th>
                                        <th className="px-5 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">State</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-[10px]">
                                    {recentArenas.map((arena) => (
                                        <tr key={arena._id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="font-black text-white uppercase italic tracking-tight">{arena.name}</div>
                                                <div className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">{new Date(arena.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-black text-slate-300">{arena.slotsCount}/{arena.maxSlots} <span className="text-slate-500 ml-1">SLOTS</span></div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="font-black text-emerald-400 tracking-wider">
                                                    +₹{((arena.slotsCount * arena.entryFee) * (gamification.commissionPercentage / 100)).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                                    arena.status === 'open' ? 'text-indigo-400 bg-indigo-500/10' :
                                                    arena.status === 'full' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-white/5'
                                                }`}>
                                                    {arena.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {selectedMatchForArena && (
                    <CreateArenaModal
                        matchId={selectedMatchForArena._id}
                        matchName={`${selectedMatchForArena.teams[0].shortName || selectedMatchForArena.teams[0].name} vs ${selectedMatchForArena.teams[1].shortName || selectedMatchForArena.teams[1].name}`}
                        isOpen={!!selectedMatchForArena}
                        onClose={() => setSelectedMatchForArena(null)}
                        onSuccess={() => {
                            setSelectedMatchForArena(null);
                            fetchStats();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
