"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Award, TrendingUp, Search } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
    _id: string;
    userId: {
        name: string;
        email: string;
    };
    totalRuns: number;
    totalBalls: number;
}

export default function LeaderboardPage() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch("/api/leaderboard");
                const data = await res.json();
                if (res.ok) setEntries(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 15000); // Refresh every 15s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 pb-20">
            {/* Header Section */}
            <div className="bg-slate-900 border-b border-slate-800 pt-20 pb-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-blue-600/20 text-blue-500 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-2xl shadow-blue-500/20">
                        <Trophy className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2">Global Leaderboard</h1>
                    <p className="text-slate-400 font-medium">Top performing users across all World Cup matches</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-8">
                {loading && entries.length === 0 ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Standings</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Runs</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">S/R</span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-800">
                            {entries.map((entry, index) => (
                                <div key={entry._id} className={`p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors ${index < 3 ? 'bg-blue-500/5' : ''}`}>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm
                      ${index === 0 ? 'bg-yellow-500 text-yellow-950' :
                                                index === 1 ? 'bg-slate-300 text-slate-900' :
                                                    index === 2 ? 'bg-orange-500 text-orange-950' :
                                                        'text-slate-500'}`}
                                        >
                                            {index + 1}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold">
                                                {entry.userId?.name?.[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{entry.userId?.name || 'Anonymous'}</p>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Verified User</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-right min-w-[60px]">
                                            <p className="text-xl font-black text-white leading-none">{entry.totalRuns}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">Runs</p>
                                        </div>
                                        <div className="text-right min-w-[60px]">
                                            <p className="text-sm font-bold text-blue-500 leading-none">
                                                {entry.totalBalls > 0 ? ((entry.totalRuns / entry.totalBalls) * 100).toFixed(1) : '0.0'}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">SR</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
                    <Medal className="w-8 h-8 text-yellow-500" />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Winner Prize</p>
                        <p className="text-lg font-black text-white">$5,000</p>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-4">
                    <Award className="w-8 h-8 text-blue-500" />
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Top 100 Reward</p>
                        <p className="text-lg font-black text-white">VIP Badge</p>
                    </div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-4 text-slate-500">
                    <TrendingUp className="w-8 h-8" />
                    <p className="text-xs font-medium italic">Ranking updates every 15 seconds during live matches.</p>
                </div>
            </div>
        </div>
    );
}
