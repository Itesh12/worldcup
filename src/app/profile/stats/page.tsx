"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Activity, Zap, Target, Calendar, MapPin, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface DetailedStats {
    overview: {
        matches: number;
        runs: number;
        balls: number;
        average: string;
        strikeRate: string;
        highestScore: number;
    };
    history: {
        matchId: string;
        date: string;
        opponent: string;
        teams: { name: string; shortName: string }[];
        venue: string;
        runs: number;
        balls: number;
        strikeRate: string;
        outcome: string;
    }[];
}

export default function ProfileStatsPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<DetailedStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetailedStats();
    }, []);

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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-[#050B14] pb-20 relative overflow-x-hidden text-white">
            {/* Ambient Backlights */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Link>
                    <h1 className="text-lg md:text-xl font-black tracking-tight">Performance Analysis</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 pt-8 space-y-8">

                {/* User Profile Summary */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#050B14] overflow-hidden">
                            {session?.user?.image ? (
                                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xl">{session?.user?.name?.[0]}</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{session?.user?.name}</h2>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
                            Batsman
                        </span>
                    </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Matches"
                        value={stats.overview.matches}
                        icon={<Trophy className="w-4 h-4 text-yellow-500" />}
                    />
                    <StatCard
                        label="Total Runs"
                        value={stats.overview.runs}
                        icon={<Activity className="w-4 h-4 text-indigo-500" />}
                        highlight
                    />
                    <StatCard
                        label="Strike Rate"
                        value={stats.overview.strikeRate}
                        icon={<Zap className="w-4 h-4 text-orange-500" />}
                    />
                    <StatCard
                        label="Highest"
                        value={stats.overview.highestScore}
                        icon={<Target className="w-4 h-4 text-emerald-500" />}
                    />
                </div>

                {/* Detailed Stats Row 2 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Batting Average</p>
                        <p className="text-3xl font-black text-white">{stats.overview.average}</p>
                    </div>
                    <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/5">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Balls Faced</p>
                        <p className="text-3xl font-black text-white">{stats.overview.balls}</p>
                    </div>
                </div>

                {/* Match History */}
                <section>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        Recent Matches
                    </h3>

                    <div className="space-y-3">
                        {stats.history.length > 0 ? (
                            stats.history.map((match) => (
                                <div key={match.matchId} className="group p-4 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-500">
                                                {new Date(match.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${match.runs >= 30 ? 'bg-green-500/10 text-green-500' : 'bg-slate-800 text-slate-500'
                                                }`}>
                                                {match.runs >= 30 ? 'Great Knock' : 'Played'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-500">
                                            <MapPin className="w-3 h-3" />
                                            <span className="text-[10px] uppercase font-bold truncate max-w-[100px]">{match.venue.split(',')[0]}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-white mb-0.5">
                                                vs {match.teams.find(t => t.name !== "Unknown")?.shortName || "Opponent"}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                                                Match #{match.matchId.slice(-4)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 text-right">
                                            <div>
                                                <p className="text-2xl font-black text-white leading-none">{match.runs}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Runs</p>
                                            </div>
                                            <div className="w-px h-8 bg-white/10" />
                                            <div>
                                                <p className="text-lg font-bold text-slate-300 leading-none">{match.balls}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Balls</p>
                                            </div>
                                            <div className="hidden sm:block">
                                                <p className="text-lg font-bold text-indigo-400 leading-none">{match.strikeRate}</p>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">SR</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 opacity-50">
                                <p className="text-slate-400">No matches played yet.</p>
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    );
}

function StatCard({ label, value, icon, highlight = false }: { label: string, value: string | number, icon: any, highlight?: boolean }) {
    return (
        <div className={`p-4 rounded-2xl border backdrop-blur-sm transition-all ${highlight
                ? 'bg-indigo-600/10 border-indigo-500/30'
                : 'bg-slate-900/40 border-white/5 hover:bg-slate-800/60'
            }`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${highlight ? 'text-indigo-300' : 'text-slate-500'}`}>
                    {label}
                </span>
            </div>
            <p className={`text-2xl md:text-3xl font-black ${highlight ? 'text-indigo-400' : 'text-white'}`}>
                {value}
            </p>
        </div>
    );
}
