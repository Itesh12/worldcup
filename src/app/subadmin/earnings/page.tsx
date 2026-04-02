"use client";

import React, { useEffect, useState } from "react";
import { 
    IndianRupee, 
    TrendingUp, 
    CreditCard, 
    ArrowUpRight, 
    ArrowDownRight, 
    Calendar,
    Clock,
    ChevronRight,
    Trophy,
    RefreshCw,
    Wallet,
    BarChart3,
    History
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { Spinner } from "@/components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";

export default function SubAdminEarningsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchEarnings = async () => {
        try {
            const res = await fetch("/api/subadmin/earnings");
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            showToast("Failed to sync financial velocity", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const role = (session?.user as any)?.role;
            if (role !== "subadmin" && role !== "admin") {
                router.push("/dashboard");
            } else {
                fetchEarnings();
            }
        }
    }, [status, session]);

    if (loading || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Financial Grid...</p>
            </div>
        );
    }

    const { summary, velocity, transactions } = data;

    // Dynamic Tier Logic
    const totalEarned = summary.totalCommissionEarned || 0;
    const tierConfig = [
        { name: "Bronze", min: 0, max: 1000 },
        { name: "Silver", min: 1000, max: 5000 },
        { name: "Gold", min: 5000, max: 20000 },
        { name: "Diamond", min: 20000, max: Infinity }
    ];

    const currentTier = tierConfig.reverse().find(t => totalEarned >= t.min) || tierConfig[tierConfig.length - 1];
    tierConfig.reverse(); // Reset order for progress calculation
    
    const nextTier = tierConfig.find(t => totalEarned < t.max);
    const progress = nextTier 
        ? Math.round(((totalEarned - nextTier.min) / (nextTier.max - nextTier.min)) * 100) 
        : 100;

    const StatCard = ({ title, value, icon: Icon, trend, subValue }: any) => (
        <div className="bg-[#0A0F1C] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/[0.03] to-transparent" />
            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    {trend !== null && trend !== undefined && (
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            trend > 0 ? "bg-emerald-500/10 text-emerald-400" : 
                            trend < 0 ? "bg-red-500/10 text-red-400" : 
                            "bg-slate-500/10 text-slate-400"
                        }`}>
                            {trend > 0 && <ArrowUpRight className="w-3 h-3" />}
                            {trend < 0 && <ArrowDownRight className="w-3 h-3" />}
                            {trend === 0 ? "Stable" : `${Math.abs(trend)}%`}
                        </div>
                    )}
                </div>
                <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 block">{title}</span>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter">₹{value.toLocaleString()}</h2>
                    {subValue && <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{subValue}</span>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-10 space-y-12 max-w-[1600px] mx-auto pb-24 animate-in fade-in duration-700">
            {/* Header is now at Layout Level */}

            {/* Financial Velocity Control (Repositioned to Content) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5 relative z-10">
                <div className="flex flex-col gap-2">
                    <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                        Financial <span className="text-purple-500 font-black">Velocity</span>
                    </h2>
                    <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest px-1 italic">
                        Settlement & Revenue Analytics • {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            setLoading(true);
                            fetchEarnings();
                        }}
                        className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-95 group shrink-0"
                    >
                        <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-600/20 active:scale-95">
                        <IndianRupee className="w-4 h-4" />
                        Initiate Withdrawal
                    </button>
                </div>
            </div>

            {/* Main Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Yield" 
                    value={summary.totalCommission} 
                    icon={TrendingUp} 
                    trend={summary.trend}
                    subValue="Verified Settlements"
                />
                <StatCard 
                    title="Payout Pipeline" 
                    value={summary.pendingCommission} 
                    icon={Clock} 
                    subValue="Awaiting Match Closure"
                />
                <StatCard 
                    title="Franchise Scale" 
                    value={summary.totalRevenue} 
                    icon={Trophy} 
                    subValue="Gross Portfolio Value"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Velocity Chart */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Earnings Velocity</h3>
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Last 7 Days</span>
                    </div>

                    <div className="bg-[#0A0F1C] border border-white/5 rounded-[40px] p-10 h-80 flex items-end justify-between gap-4 md:gap-8 overflow-hidden relative">
                        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5 pointer-events-none" />
                        {velocity.map((day: any, i: number) => {
                            const max = Math.max(...velocity.map((d: any) => d.amount));
                            const height = max > 0 ? (day.amount / max) * 100 : 0;
                            
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                                    <div className="relative w-full flex flex-col items-center justify-end h-48">
                                        <div className="absolute -top-8 text-[10px] font-black text-purple-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                            ₹{day.amount.toLocaleString()}
                                        </div>
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${height}%` }}
                                            transition={{ duration: 1, delay: i * 0.1, ease: "easeOut" }}
                                            className="w-full max-w-[40px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-2xl group-hover/bar:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
                                        />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-center truncate w-full">
                                        {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tier Progress */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Tier Trajectory</h3>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-[40px] p-8 space-y-6 relative overflow-hidden shadow-2xl">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-[60px] rounded-full" />
                        
                        <div>
                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-2 block">Current Status</span>
                            <div className="flex items-end gap-3">
                                <h4 className="text-4xl font-black text-white italic uppercase tracking-tighter">{currentTier.name}</h4>
                                <span className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Franchise Tier</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span>{nextTier ? `Progress to ${nextTier.name}` : 'Max Tier Reached'}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="h-4 bg-black/40 rounded-full p-1 border border-white/5 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                                {nextTier 
                                    ? `Reach ₹${nextTier.max.toLocaleString()} in lifetime commissions to unlock ${nextTier.name} Tier rewards.` 
                                    : "You have reached the pinnacle of franchise achievements. Elite support active."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payout Ledger */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Settlement Ledger</h3>
                    </div>
                    <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
                        View Full History <ChevronRight className="w-3 h-3" />
                    </button>
                </div>

                <div className="bg-[#0A0F1C] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-950/40 border-b border-white/5">
                                    <th className="px-10 py-7 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Source Operation</th>
                                    <th className="px-10 py-7 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Gross Revenue</th>
                                    <th className="px-10 py-7 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Yield Yield</th>
                                    <th className="px-10 py-7 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Status</th>
                                    <th className="px-10 py-7 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {transactions.map((t: any) => (
                                    <tr key={t._id} className="group hover:bg-white/[0.02] transition-all duration-300">
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                                    <Trophy className="w-5 h-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-base font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">{t.name}</span>
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Arena Settlement</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-sm font-black text-white italic">₹{t.revenue.toLocaleString()}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <span className="text-sm font-black text-emerald-400 italic">₹{t.commission.toLocaleString()}</span>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                t.status === 'completed' || t.status === 'closed' 
                                                ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
                                                : 'bg-amber-500/5 text-amber-400 border-amber-500/20'
                                            }`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'completed' || t.status === 'closed' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                                                {t.status === 'completed' || t.status === 'closed' ? 'Settled' : 'In Pipeline'}
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-slate-400 tabular-nums">{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">
                                                    {new Date(t.createdAt).toLocaleTimeString(undefined, { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit',
                                                        hour12: true 
                                                    })}
                                                </span>
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
    );
}
