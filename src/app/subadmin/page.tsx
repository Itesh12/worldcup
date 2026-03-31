"use client";

import React, { useEffect, useState } from "react";
import { 
    Users, 
    Swords, 
    IndianRupee, 
    TrendingUp, 
    Plus, 
    LayoutDashboard, 
    PieChart, 
    RefreshCw, 
    ChevronRight,
    Trophy,
    ArrowUpRight,
    Users2,
    Calendar,
    Zap,
    Activity
} from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/Spinner";
import { AnimatePresence } from "framer-motion";
import ArenaManager from "@/components/shared/ArenaManager";

interface Stats {
    usersCount: number;
    arenasCount: number;
    commissionEarned: number;
    brandName: string;
    commissionPercentage: number;
}

interface RecentArena {
    _id: string;
    name: string;
    entryFee: number;
    slotsCount: number;
    maxSlots: number;
    status: string;
    createdAt: string;
}

interface Commission {
    _id: string;
    amount: number;
    description: string;
    createdAt: string;
    status: string;
}

interface Match {
    _id: string;
    teams: { name: string; shortName: string }[];
    startTime: string;
    venue: string;
    status: string;
}

export default function SubAdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentArenas, setRecentArenas] = useState<RecentArena[]>([]);
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'arenas' | 'commissions'>('arenas');
    const [selectedMatchForArena, setSelectedMatchForArena] = useState<Match | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const [statsRes, commRes] = await Promise.all([
                fetch("/api/subadmin/stats"),
                fetch("/api/subadmin/commissions")
            ]);
            
            const statsData = await statsRes.json();
            const commData = await commRes.json();

            if (statsRes.ok) {
                setStats(statsData.stats);
                setRecentArenas(statsData.recentArenas);
            }
            if (commRes.ok) {
                setCommissions(commData);
            }

            // Fetch upcoming matches for the "Match Center"
            const matchRes = await fetch("/api/matches?status=upcoming");
            const matchData = await matchRes.json();
            if (matchRes.ok) {
                setUpcomingMatches(matchData.slice(0, 4)); // Just top 4 for the dashboard
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing Franchise Suite...</p>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 space-y-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                        {stats?.brandName} <span className="text-purple-500">Dashboard</span>
                    </h1>
                    <div className="flex items-center gap-3">
                        <div className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px] font-black text-purple-400 uppercase tracking-widest">
                            Sub-Admin Active
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                            Manage your franchise network and arenas
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
                        href="/subadmin/arenas/new"
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3.5 rounded-2xl text-xs font-black transition-all shadow-xl shadow-purple-600/20 uppercase tracking-widest"
                    >
                        <Plus className="w-4 h-4" /> Create Arena
                    </Link>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Revenue Share", value: stats?.commissionEarned?.toFixed(2), icon: IndianRupee, color: "emerald", prefix: "₹" },
                    { label: "Active Players", value: stats?.usersCount, icon: Users2, color: "indigo" },
                    { label: "My Arenas", value: stats?.arenasCount, icon: Swords, color: "purple" },
                    { label: "Commission Rate", value: stats?.commissionPercentage, icon: PieChart, color: "orange", suffix: "%" }
                ].map((item, idx) => (
                    <div key={idx} className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl group hover:border-purple-500/30 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl bg-${item.color}-500/10 border border-${item.color}-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className={`w-5 h-5 text-${item.color}-400`} />
                            </div>
                            <TrendingUp className="w-4 h-4 text-slate-700" />
                        </div>
                        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{item.label}</h3>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white tracking-tighter">
                                {item.prefix}{item.value}{item.suffix}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Match Center Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                        <Zap className="w-6 h-6 text-indigo-400" /> Match <span className="text-indigo-400">Center</span>
                    </h2>
                    <Link href="/matches" className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
                        Full Schedule <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {upcomingMatches.map((match) => (
                        <div key={match._id} className="bg-slate-900/40 border border-white/5 p-5 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                            <div className="absolute -top-10 -right-10 w-20 h-20 bg-indigo-500/10 blur-[30px] rounded-full" />
                            
                            <div className="flex justify-between items-center mb-4">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {new Date(match.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                    Upcoming
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 mb-6">
                                <div className="flex-1 text-center">
                                    <div className="text-lg font-black text-white uppercase tracking-tighter italic">{match.teams[0].shortName}</div>
                                </div>
                                <div className="text-[10px] font-black text-slate-700 italic">VS</div>
                                <div className="flex-1 text-center">
                                    <div className="text-lg font-black text-white uppercase tracking-tighter italic">{match.teams[1].shortName}</div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedMatchForArena(match)}
                                className="w-full py-3 bg-white/5 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 hover:border-indigo-500 flex items-center justify-center gap-2"
                            >
                                <Swords className="w-3 h-3" /> Host Arena
                            </button>
                        </div>
                    ))}
                    {upcomingMatches.length === 0 && (
                        <div className="col-span-full py-10 bg-white/5 border border-dashed border-white/10 rounded-3xl flex flex-center justify-center">
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No matches available for hosting right now</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Arenas Table */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setActiveTab('arenas')}
                                className={`text-lg font-black italic uppercase tracking-tight flex items-center gap-3 transition-all ${activeTab === 'arenas' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                            >
                                <Trophy className={`w-5 h-5 ${activeTab === 'arenas' ? 'text-purple-500' : 'text-slate-700'}`} /> 
                                Recent <span className={activeTab === 'arenas' ? 'text-purple-500' : ''}>Arenas</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('commissions')}
                                className={`text-lg font-black italic uppercase tracking-tight flex items-center gap-3 transition-all ${activeTab === 'commissions' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
                            >
                                <IndianRupee className={`w-5 h-5 ${activeTab === 'commissions' ? 'text-emerald-500' : 'text-slate-700'}`} /> 
                                Revenue <span className={activeTab === 'commissions' ? 'text-emerald-500' : ''}>Logs</span>
                            </button>
                        </div>
                        <Link href={activeTab === 'arenas' ? "/subadmin/arenas" : "#"} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-1">
                            View All <ChevronRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="bg-slate-950/40 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-xl">
                        {activeTab === 'arenas' ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Arena Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fee</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fill Rate</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {recentArenas.map((arena) => (
                                            <tr key={arena._id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-white text-sm uppercase italic tracking-tight">{arena.name}</div>
                                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(arena.createdAt).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-emerald-400 text-sm">₹{arena.entryFee}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                                                                style={{ width: `${(arena.slotsCount / arena.maxSlots) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-400">{arena.slotsCount}/{arena.maxSlots}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                        arena.status === 'open' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                        arena.status === 'full' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                                                        'bg-slate-500/10 border-slate-500/20 text-slate-400'
                                                    }`}>
                                                        {arena.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button className="p-2 text-slate-600 group-hover:text-white transition-colors">
                                                        <ArrowUpRight className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {recentArenas.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-20 text-center">
                                                    <div className="opacity-30 flex flex-col items-center gap-4">
                                                        <Swords className="w-12 h-12 text-slate-600" />
                                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No arenas created yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {commissions.map((comm) => (
                                            <tr key={comm._id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-white text-sm uppercase tracking-tight">{comm.description}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-emerald-400 text-base">+ ₹{comm.amount.toFixed(2)}</div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                                        {new Date(comm.createdAt).toLocaleDateString()} at {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black uppercase text-emerald-400 tracking-widest">
                                                        {comm.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {commissions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-20 text-center">
                                                    <div className="opacity-30 flex flex-col items-center gap-4">
                                                        <IndianRupee className="w-12 h-12 text-slate-600" />
                                                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No revenue recorded yet</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Chart Column */}
                <div className="space-y-6">
                    <h2 className="text-lg font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-500" /> Franchise <span className="text-purple-500">Context</span>
                    </h2>
                    
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-4 -translate-y-4 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500">
                            <PieChart className="w-32 h-32 text-white" />
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                            <div>
                                <h3 className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Lifetime Earnings</h3>
                                <div className="text-4xl font-black text-white tracking-tighter italic leading-none">
                                    ₹{(stats?.commissionEarned || 0).toLocaleString()}
                                </div>
                            </div>
                            
                            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-3">Goal Progress</p>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-black text-white italic">Level 1 Bronze</span>
                                    <span className="text-[10px] font-black text-white/50 uppercase">75%</span>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-[75%] bg-white rounded-full shadow-[0_0_15px_#fff]" />
                                </div>
                            </div>
                            
                            <button className="w-full py-4 bg-white text-purple-700 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
                                Withdraw Commissions
                            </button>
                        </div>
                    </div>

                    {/* Quick Access List */}
                    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Network Tools</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group">
                                <Users2 className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase">Invite</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all group">
                                <LayoutDashboard className="w-5 h-5 text-slate-400 group-hover:text-purple-400" />
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase">Rules</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedMatchForArena && (
                    <ArenaManager
                        matchId={selectedMatchForArena._id}
                        matchName={`${selectedMatchForArena.teams[0].shortName} VS ${selectedMatchForArena.teams[1].shortName}`}
                        userRole="subadmin"
                        onClose={() => setSelectedMatchForArena(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
