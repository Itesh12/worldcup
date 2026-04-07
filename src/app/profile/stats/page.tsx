"use client";

import { useEffect, useState } from "react";
import { 
    ArrowLeft, 
    Trophy, 
    Activity, 
    Zap, 
    Target, 
    Calendar, 
    MapPin, 
    TrendingUp, 
    Swords, 
    Shield, 
    Flame, 
    Award,
    ChevronRight,
    BarChart3
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

interface DetailedStats {
    overview: {
        matches: number;
        runs: number;
        balls: number;
        average: string;
        strikeRate: string;
        highestScore: number;
        netWorth: number;
    };
    ledger: {
        userId: string;
        name: string;
        amount: number;
        matches: {
            matchId: string;
            amount: number;
            type: 'gain' | 'loss';
            date: string;
        }[];
    }[];
    history: {
        matchId: string;
        date: string;
        opponent: string;
        teams: { name: string; shortName: string }[];
        venue: string;
        runs: number;
        balls: number;
        strikeRate: string;
        outcome: 'win' | 'loss' | 'played';
        pnl: number;
    }[];
}

export default function ProfileStatsPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DetailedStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'magnitude' | 'rivalries' | 'chronicle'>('magnitude');

    useEffect(() => {
        const fetchDetailedStats = async () => {
            try {
                const res = await fetch("/api/user/stats?detailed=true");
                if (res.ok) {
                    setStats(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch detailed stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetailedStats();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Analyzing Battle Intel...</span>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const rankName = stats.overview.runs < 500 ? 'Rookie' :
                     stats.overview.runs < 1500 ? 'Veteran' :
                     stats.overview.runs < 5000 ? 'Elite' : 'Legend';

    return (
        <div className="min-h-screen bg-[#050B14] pb-24 text-white relative">
            {/* Ambient Backdrops */}
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="p-2.5 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Session Data</span>
                            <h1 className="text-xl font-black uppercase italic tracking-tighter">Deep Analysis</h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pt-10 space-y-12 relative z-10">
                
                {/* 1. Hero Summary */}
                <section className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-slate-900/40 border border-white/5 shadow-2xl flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-1">
                        <div className="w-full h-full rounded-full bg-[#050B14] overflow-hidden flex items-center justify-center font-black text-5xl italic text-white/20">
                            {session?.user?.image ? <img src={session.user.image} className="w-full h-full object-cover" /> : session?.user?.name?.[0]}
                        </div>
                    </div>
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
                            <Award className="w-3 h-3 text-indigo-400" />
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{rankName} Class</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-2">{session?.user?.name}</h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Tournament Participant</p>
                    </div>
                </section>

                {/* 2. Navigation */}
                <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl w-fit">
                    {(['magnitude', 'rivalries', 'chronicle'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* 3. Dynamic Content */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'magnitude' && (
                            <motion.div key="magnitude" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatsCard label="Runs" value={stats.overview.runs} sub="Career Runs" icon={Flame} color="rose" />
                                    <StatsCard label="Average" value={stats.overview.average} sub="Batting Purity" icon={Target} color="indigo" />
                                    <StatsCard label="Strike Rate" value={stats.overview.strikeRate} sub="Intensity" icon={Zap} color="amber" />
                                    <StatsCard label="Peak" value={stats.overview.highestScore} sub="Highest Impact" icon={Trophy} color="emerald" />
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem]">
                                        <h4 className="text-xs font-black uppercase tracking-widest mb-8 text-indigo-400">Intensity Metrics</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <MetricBar label="Consistency" value={parseFloat(stats.overview.average) || 0} max={100} />
                                            <MetricBar label="Aggression" value={parseFloat(stats.overview.strikeRate) / 2 || 0} max={100} />
                                            <MetricBar label="Magnitude" value={stats.overview.runs / 10 || 0} max={100} />
                                            <MetricBar label="Engagement" value={stats.overview.matches || 0} max={100} />
                                        </div>
                                    </div>
                                    <div className="p-8 bg-indigo-900/20 border border-indigo-500/10 rounded-[2.5rem] flex flex-col justify-center">
                                        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Net Portfolio</h4>
                                        <p className="text-4xl font-black italic tracking-tighter mb-2">₹{stats.overview.netWorth.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Active context net value output</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'rivalries' && (
                            <motion.div key="rivalries" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stats.ledger.length > 0 ? stats.ledger.map((item) => (
                                    <div key={item.userId} className="p-6 bg-slate-900/40 border border-white/5 rounded-[2rem]">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center font-black text-indigo-400">{item.name[0]}</div>
                                                <div className="text-sm font-black uppercase tracking-tight">{item.name}</div>
                                            </div>
                                            <div className={`text-lg font-black italic ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{item.amount}</div>
                                        </div>
                                        <div className="space-y-2">
                                            {item.matches.map((m, idx) => (
                                                <div key={idx} className="flex justify-between py-1.5 border-t border-white/5 text-[10px] font-bold text-slate-500">
                                                    <span>{new Date(m.date).toLocaleDateString()}</span>
                                                    <span className={m.type === 'gain' ? 'text-emerald-500' : 'text-rose-500'}>{m.type === 'gain' ? '+' : '-'}₹{Math.abs(m.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )) : <div className="col-span-full text-center py-20 text-slate-600 font-black uppercase text-[10px]">No rivalries recorded</div>}
                            </motion.div>
                        )}

                        {activeTab === 'chronicle' && (
                            <motion.div key="chronicle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                                {stats.history.map((match) => (
                                    <div key={match.matchId} className="p-6 bg-slate-900/40 border border-white/5 rounded-[2rem] flex flex-col md:flex-row items-center gap-6">
                                        <div className="w-full md:w-auto">
                                            <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">{new Date(match.date).toLocaleDateString()}</span>
                                            <h5 className="text-lg font-black uppercase italic tracking-tighter leading-none">vs {match.teams.find(t => t.name !== "Unknown")?.shortName || "Opponent"}</h5>
                                        </div>
                                        <div className="flex-1 grid grid-cols-3 gap-6 text-center border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
                                            <div><p className="text-2xl font-black italic leading-none">{match.runs}</p><span className="text-[8px] font-black text-slate-600 uppercase">Runs</span></div>
                                            <div><p className="text-xl font-black italic leading-none">{match.balls}</p><span className="text-[8px] font-black text-slate-600 uppercase">Balls</span></div>
                                            <div><p className="text-xl font-black italic leading-none">{match.strikeRate}</p><span className="text-[8px] font-black text-slate-600 uppercase">SR</span></div>
                                        </div>
                                        <div className="text-right border-l border-white/5 pl-6 hidden md:block">
                                            <p className={`text-lg font-black italic ${match.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>₹{match.pnl}</p>
                                            <span className="text-[9px] font-black uppercase text-slate-600">Yield</span>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}

function StatsCard({ label, value, sub, icon: Icon, color }: any) {
    const colors: any = { rose: 'text-rose-400', indigo: 'text-indigo-400', amber: 'text-amber-400', emerald: 'text-emerald-400' };
    return (
        <div className="p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] relative overflow-hidden group">
            <Icon className={`w-8 h-8 ${colors[color]} mb-6 transition-transform group-hover:scale-110`} />
            <p className="text-4xl font-black italic tracking-tighter mb-2">{value}</p>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{sub}</p>
        </div>
    );
}

function MetricBar({ label, value, max }: any) {
    const pct = Math.min((value / max) * 100, 100);
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                <span>{label}</span>
                <span className="text-indigo-400">{Math.round(pct)}%</span>
            </div>
            <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} className="h-full bg-indigo-600" />
            </div>
        </div>
    );
}
