"use client";

import { useEffect, useState, Suspense } from "react";
import { Trophy, Medal, Award, TrendingUp, Search, ArrowLeft, IndianRupee, Target, Crown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTournament } from "@/contexts/TournamentContext";

interface LeaderboardEntry {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        image?: string;
    };
    netProfit: number;
    totalWon: number;
    winCount: number;
}

function LeaderboardContent() {
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";
    const { tournamentId } = useTournament();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const url = tournamentId 
                    ? `/api/leaderboard?tournamentId=${tournamentId}`
                    : `/api/leaderboard`;
                const res = await fetch(url);
                const data = await res.json();
                if (res.ok) setEntries(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30000); // 30s refresh for precision
        return () => clearInterval(interval);
    }, [tournamentId]);

    return (
        <div className="min-h-screen bg-[#020617] pb-20 pt-24 text-slate-200">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full" />
            </div>

            {/* Standardized Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <Link href={`/dashboard${isPlayerView ? "?view=player" : ""}`} className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <Crown className="shrink-0 w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                            <h1 className="text-sm md:text-xl font-black text-white tracking-tight italic uppercase truncate">
                                {tournamentId ? "League" : "Global"} <span className="text-indigo-500">{tournamentId ? "Top Profiteers" : "Wealth Ranking"}</span>
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="max-w-7xl mx-auto px-4 mb-12 relative z-10">
                <div className="relative overflow-hidden rounded-[40px] p-8 md:p-12 bg-slate-900/40 border border-white/5 backdrop-blur-3xl shadow-inner-white">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Trophy className="w-48 h-48 text-indigo-500 transform rotate-12" />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 italic uppercase leading-none">
                                Wealth & <span className="text-indigo-500">Prowess</span>
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">
                                {tournamentId ? "The absolute financial elite of this league" : "Global rankings based on net lifetime profit"}
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Top Prize</p>
                                <p className="text-2xl font-black text-white italic">₹50,000</p>
                            </div>
                            <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Active Pros</p>
                                <p className="text-2xl font-black text-white italic">{entries.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 relative z-10">
                <div className="flex flex-col gap-6">
                    {loading ? (
                        [1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-24 bg-slate-900/40 border border-white/5 rounded-[2.5rem] animate-pulse" />
                        ))
                    ) : (
                        <div className="grid gap-4">
                            {/* Table Header - Desktop Only */}
                            <div className="hidden md:grid grid-cols-12 px-10 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                <div className="col-span-1">Rank</div>
                                <div className="col-span-4">Contestant</div>
                                <div className="col-span-2 text-center">Wins</div>
                                <div className="col-span-5 text-right">Net Profit</div>
                            </div>

                            {entries.map((entry, index) => (
                                <div 
                                    key={entry._id} 
                                    className={`group relative grid grid-cols-12 items-center p-5 md:p-7 bg-slate-900/40 border border-white/5 rounded-[2.5rem] transition-all duration-500 hover:bg-slate-800/60 hover:border-indigo-500/30 hover:-translate-y-1 shadow-xl ${index < 3 ? 'bg-gradient-to-r from-indigo-500/5 via-transparent to-transparent border-indigo-500/20' : ''}`}
                                >
                                    {/* Rank Indicator */}
                                    <div className="col-span-2 md:col-span-1 flex items-center gap-4">
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center font-black text-xs md:text-sm
                                            ${index === 0 ? 'bg-yellow-500 text-yellow-950 shadow-[0_0_20px_rgba(234,179,8,0.3)]' :
                                            index === 1 ? 'bg-slate-300 text-slate-950 shadow-[0_0_20px_rgba(203,213,225,0.2)]' :
                                            index === 2 ? 'bg-orange-500 text-orange-950 shadow-[0_0_20px_rgba(249,115,22,0.2)]' :
                                            'bg-white/5 text-slate-400 group-hover:text-white'}`}
                                        >
                                            {index + 1}
                                        </div>
                                    </div>

                                    {/* User Details */}
                                    <div className="col-span-10 md:col-span-4 flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-slate-800 border-2 border-white/5 overflow-hidden flex items-center justify-center shadow-inner group-hover:border-indigo-500/50 transition-colors">
                                                {entry.userId?.image ? (
                                                    <img src={entry.userId.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl font-black text-slate-600 italic uppercase">{entry.userId?.name?.[0] || 'A'}</span>
                                                )}
                                            </div>
                                            {index < 3 && (
                                                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center shadow-lg">
                                                    <Medal className={`w-3 h-3 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : 'text-orange-500'}`} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm md:text-base font-black text-white italic uppercase tracking-tight truncate">{entry.userId?.name || 'Anonymous Pro'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Target className="w-3 h-3 text-slate-600" />
                                                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest">{entry.winCount} Match Victories</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Wins - Desktop only */}
                                    <div className="hidden md:flex col-span-2 flex-col items-center">
                                        <p className="text-xl font-black text-indigo-400 italic">{entry.winCount}</p>
                                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Contests</p>
                                    </div>

                                    {/* Profit - Primary Metric */}
                                    <div className="col-span-12 md:col-span-5 flex items-center justify-end gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-white/5">
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 md:gap-2">
                                                <IndianRupee className={`w-4 h-4 md:w-6 md:h-6 ${entry.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                                                <span className={`text-2xl md:text-4xl font-black italic tracking-tighter ${entry.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {Math.abs(entry.netProfit).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 shrink-0">
                                                Net Lifetime Profit
                                            </p>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:border-indigo-400 group-hover:scale-110 transition-all duration-500">
                                            <TrendingUp className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Insight */}
            <div className="max-w-4xl mx-auto px-4 mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex items-start gap-5">
                    <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                        <Award className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white italic uppercase tracking-widest mb-2">The Elite Circle</h4>
                        <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed">
                            Pro-tier rankings are calculated based on entry fees vs winnings. Maintain a positive net profit to unlock exclusive "Host" features.
                        </p>
                    </div>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl flex items-start gap-5">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                        <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white italic uppercase tracking-widest mb-2">Real-time Updates</h4>
                        <p className="text-slate-500 text-[10px] md:text-xs font-medium leading-relaxed">
                            Financial data is synchronized with the Match hub every 30 seconds to ensure absolute transparency across all tiers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LeaderboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Trophy className="w-12 h-12 text-indigo-500 animate-pulse" />
            </div>
        }>
            <LeaderboardContent />
        </Suspense>
    );
}
