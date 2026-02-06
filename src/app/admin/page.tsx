"use client";

import { useEffect, useState } from "react";
import { Users, Trophy, Activity, TrendingUp, ShieldCheck, Clock, CheckCircle, Ticket, Medal, Flame, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface AnalyticsData {
    users: {
        total: number;
        active: number;
        banned: number;
        admins: number;
    };
    matches: {
        total: number;
        live: number;
        upcoming: number;
        finished: number;
    };
    engagement: {
        totalAssignments: number;
        activeAssignments: number;
    };
    performance: {
        totalRuns: number;
        topPlayers: {
            name: string;
            image?: string;
            totalRuns: number;
        }[];
    };
}

export default function AdminDashboardPage() {
    const { data: session } = useSession();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch("/api/admin/analytics");
            if (res.ok) {
                const json = await res.json();
                console.log("Admin Analytics Data:", json);
                setData(json);
            }
        } catch (error) {
            console.error("Failed to fetch analytics", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
            {/* Premium Dashboard Header */}
            <header className="sticky top-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 py-6">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight sm:text-5xl">
                            Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Intelligence</span>
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide uppercase">
                            Real-time analytics and performance monitoring
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-indigo-500/5 border border-indigo-500/20 px-5 py-2.5 rounded-2xl backdrop-blur-md transition-all hover:bg-indigo-500/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">System Live</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {new Date().toLocaleDateString([], { month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 space-y-10 py-10 pb-20 relative z-10 text-white">

                {/* Row 1: Key Platform Stats - Enhanced with Inner Glows */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                    {/* Total Users */}
                    <div className="relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950 border border-white/10 shadow-2xl group transition-all duration-500 hover:scale-[1.02] hover:border-indigo-500/30">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">
                            <Users className="w-16 h-16 text-indigo-400" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-black text-indigo-300/70 uppercase tracking-[0.2em] mb-3">Total Community</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">{data.users.total}</h2>
                        </div>
                        <div className="relative z-10 mt-6 flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active</span>
                                <span className="text-sm font-bold text-white">{data.users.active}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10 mx-2" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Staff</span>
                                <span className="text-sm font-bold text-white">{data.users.admins}</span>
                            </div>
                        </div>
                    </div>

                    {/* Live Matches */}
                    <div className="relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-slate-900 via-red-950/20 to-slate-950 border border-white/10 shadow-2xl group transition-all duration-500 hover:scale-[1.02] hover:border-red-500/30">
                        <div className="absolute inset-0 bg-gradient-to-tr from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">
                            <Activity className="w-16 h-16 text-red-400" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-black text-red-300/70 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                Live Action
                                {data.matches.live > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_15px_#ef4444]" />}
                            </p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">{data.matches.live}</h2>
                        </div>
                        <div className="relative z-10 mt-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">
                                    {data.matches.live > 0 ? "Matches in Progress" : "Standby Mode"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Total Matches */}
                    <div className="relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-slate-900 via-yellow-950/10 to-slate-950 border border-white/10 shadow-2xl group transition-all duration-500 hover:scale-[1.02] hover:border-yellow-500/30">
                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500">
                            <Trophy className="w-16 h-16 text-yellow-500" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-black text-yellow-300/70 uppercase tracking-[0.2em] mb-3">Tournament Scale</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">{data.matches.total}</h2>
                        </div>
                        <div className="relative z-10 mt-6 flex items-center gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Upcoming</span>
                                <span className="text-sm font-bold text-yellow-500">{data.matches.upcoming}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10 mx-2" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</span>
                                <span className="text-sm font-bold text-slate-400">{data.matches.finished}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 2: Game Measurements */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">

                    {/* Total Bookings / Slots */}
                    <div className="relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950 border border-white/5 shadow-2xl group transition-all duration-500 hover:border-emerald-500/30">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Ticket className="w-20 h-20 text-emerald-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                    <Ticket className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-xs font-black text-emerald-200/60 uppercase tracking-widest">Slot Engagements</p>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tighter">{data?.engagement?.totalAssignments ?? 0}</h2>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-1.5 w-full bg-emerald-950 rounded-full overflow-hidden border border-emerald-500/10">
                                    <div className="h-full bg-emerald-500 rounded-full w-2/3 shadow-[0_0_10px_#10b981]" />
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 whitespace-nowrap">{data?.engagement?.activeAssignments ?? 0} ACTIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* Global Performance */}
                    <div className="relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-orange-950 via-slate-950 to-slate-950 border border-white/5 shadow-2xl group transition-all duration-500 hover:border-orange-500/30">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
                        <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-20 transition-opacity">
                            <Flame className="w-20 h-20 text-orange-400" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <Flame className="w-4 h-4 text-orange-400" />
                                </div>
                                <p className="text-xs font-black text-orange-200/60 uppercase tracking-widest">Aggregate Score</p>
                            </div>
                            <h2 className="text-4xl font-black text-white tracking-tighter">{(data?.performance?.totalRuns ?? 0).toLocaleString()}</h2>
                            <p className="text-[10px] font-black text-orange-400/70 mt-4 uppercase tracking-[0.2em]">CUMULATIVE RUNS AWARDED</p>
                        </div>
                    </div>

                    {/* Top Performers (Mini List) */}
                    <div className="rounded-[32px] p-8 bg-slate-950/40 border border-white/5 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-50" />
                        <div className="relative z-10">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Medal className="w-4 h-4 text-yellow-500" /> Elite Rank
                            </h3>
                            <div className="space-y-4">
                                {data?.performance?.topPlayers && data.performance.topPlayers.length > 0 ? (
                                    data.performance.topPlayers.map((player, i) => (
                                        <div key={i} className="flex items-center gap-4 group/item">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/10 group-hover/item:border-indigo-500/50 transition-colors">
                                                    {player.image ? (
                                                        <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-black text-white">{player.name[0]}</span>
                                                    )}
                                                </div>
                                                {i === 0 && <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-500 rounded-full border-2 border-slate-950 flex items-center justify-center text-[10px] font-bold text-black">1</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate group-hover/item:text-indigo-400 transition-colors">{player.name}</p>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{player.totalRuns} Runs</p>
                                            </div>
                                            <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${100 - (i * 20)}%` }} />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">Awaiting Competition Results</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Row 3: Deep Dives */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">

                    {/* User Integrity Analysis */}
                    <div className="p-10 rounded-[32px] bg-slate-950/40 border border-white/5 backdrop-blur-xl group">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                                    <ShieldCheck className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">User Integrity</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Platform Distribution</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-white">{data.users.total}</span>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Profiles</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            {/* Active Progress */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-indigo-300 uppercase tracking-[0.1em]">Authenticated Active</span>
                                    <span className="text-lg font-black text-white">{data.users.total > 0 ? Math.round((data.users.active / data.users.total) * 100) : 0}%</span>
                                </div>
                                <div className="h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                        style={{ width: `${data.users.total > 0 ? (data.users.active / data.users.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Risk Progress */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-red-400/70 uppercase tracking-[0.1em]">Banned / Restricted</span>
                                    <span className="text-lg font-black text-white">{data.users.total > 0 ? Math.round((data.users.banned / data.users.total) * 100) : 0}%</span>
                                </div>
                                <div className="h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                        style={{ width: `${data.users.total > 0 ? (data.users.banned / data.users.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Match Pipeline */}
                    <div className="p-10 rounded-[32px] bg-slate-950/40 border border-white/5 backdrop-blur-xl group">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 group-hover:bg-yellow-500/20 transition-colors">
                                <TrendingUp className="w-6 h-6 text-yellow-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">Fixtures Pipeline</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Lifecycle Tracking</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-6 rounded-[24px] bg-slate-900/50 border border-white/5 hover:border-indigo-500/20 transition-all group/stat">
                                <Clock className="w-8 h-8 text-indigo-500/50 group-hover/stat:text-indigo-400 transition-colors mb-4" />
                                <div className="text-3xl font-black text-white tracking-tighter">{data.matches.upcoming}</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 text-center">Upcoming</div>
                            </div>
                            <div className="p-6 rounded-[24px] bg-slate-900/50 border border-white/5 relative overflow-hidden flex flex-col items-center hover:border-red-500/20 transition-all group/stat">
                                {data.matches.live > 0 && <div className="absolute inset-0 bg-red-500/5 animate-pulse" />}
                                <Activity className="w-8 h-8 text-red-500/50 group-hover/stat:text-red-400 transition-colors mb-4 z-10" />
                                <div className="text-3xl font-black text-white tracking-tighter z-10">{data.matches.live}</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 z-10">Running</div>
                            </div>
                            <div className="p-6 rounded-[24px] bg-slate-900/50 border border-white/5 hover:border-green-500/20 transition-all group/stat">
                                <CheckCircle className="w-8 h-8 text-green-500/50 group-hover/stat:text-green-400 transition-colors mb-4" />
                                <div className="text-3xl font-black text-white tracking-tighter">{data.matches.finished}</div>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 text-center">Settled</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
