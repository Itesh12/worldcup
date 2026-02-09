
"use client";

import { useEffect, useState } from "react";
import { Trophy, ArrowLeft, PartyPopper, Medal, Star } from "lucide-react";
import Link from "next/link";

export default function HallOfFamePage() {
    const [winners, setWinners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [winCounts, setWinCounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const fetchAllWinners = async () => {
            try {
                // limit=0 to get all
                const res = await fetch('/api/matches/winners?limit=0');
                const data = await res.json();
                if (res.ok) {
                    setWinners(data);
                    // Aggregate win counts
                    const counts: { [key: string]: number } = {};
                    data.forEach((item: any) => {
                        const userId = item.winner.userId;
                        counts[userId] = (counts[userId] || 0) + 1;
                    });
                    setWinCounts(counts);
                }
            } catch (err) {
                console.error("Failed to fetch all winners", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllWinners();
    }, []);

    // Get top winners for the dominance section
    const sortedUniqueWinners = Object.entries(winCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-[#050B14] pb-20 relative overflow-x-hidden">
            {/* Ambient Backlights */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

            <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-bold uppercase tracking-widest">Back to Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-indigo-500" />
                        <h1 className="text-xl font-black text-white uppercase tracking-tight">WORLD CUP <span className="text-indigo-500">HUB</span></h1>
                    </div>
                    <div className="w-24 hidden md:block" /> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-12">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-6 group">
                        <PartyPopper className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em]">The Elite Circle</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4">Hall of <span className="text-indigo-500">Fame</span></h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Honoring the best performers of every match</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Trophy className="w-16 h-16 text-indigo-500 animate-pulse mb-4" />
                        <p className="text-white font-black uppercase tracking-widest">Loading Champions...</p>
                    </div>
                ) : winners.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/40 rounded-[3rem] border border-white/5">
                        <Star className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest">No match champions recorded yet.</p>
                    </div>
                ) : (
                    <>
                        {/* Dominance Leaderboard Section */}
                        {sortedUniqueWinners.length > 0 && (
                            <div className="mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Most Dominant Players</h3>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {sortedUniqueWinners.map(([uId, count], idx) => {
                                        const firstWin = winners.find(w => w.winner.userId === uId);
                                        return (
                                            <div key={uId} className="flex items-center gap-4 bg-slate-900/60 border border-white/5 rounded-2xl px-5 py-3 hover:border-indigo-500/30 transition-all">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' :
                                                    idx === 1 ? 'bg-slate-300 text-black' :
                                                        idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-400'
                                                    }`}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-white">{firstWin?.winner.name}</span>
                                                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{count} {count === 1 ? 'Win' : 'Wins'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {winners.map((item, idx) => (
                                <WinnerCard
                                    key={idx}
                                    item={item}
                                    rank={idx + 1}
                                    totalWins={winCounts[item.winner.userId] || 0}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function WinnerCard({ item, rank, totalWins }: { item: any; rank: number; totalWins: number }) {
    return (
        <div className="group relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all duration-500 hover:bg-slate-900/60 shadow-2xl h-full flex flex-col">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />

            <div className="relative z-10 flex items-center justify-between gap-4 mb-8">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">{new Date(item.match.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                        {item.match.teams[0]?.shortName} <span className="text-slate-600">vs</span> {item.match.teams[1]?.shortName}
                    </h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center">
                    <Medal className={`w-5 h-5 ${rank <= 3 ? 'text-yellow-500' : 'text-slate-500'}`} />
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden border-4 border-[#050B14]">
                            {item.winner.image ? (
                                <img src={item.winner.image} alt={item.winner.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-2xl font-black text-white">{item.winner.name[0]}</div>
                            )}
                        </div>
                    </div>
                    {/* Total Wins Badge */}
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg border-2 border-[#050B14] shadow-xl">
                        {totalWins} {totalWins === 1 ? 'WIN' : 'WINS'}
                    </div>
                </div>

                <h4 className="text-2xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors text-center">{item.winner.name}</h4>

                <div className="grid grid-cols-2 gap-4 w-full mt-auto">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                        <span className="text-xl font-black text-white">{item.winner.score}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Runs</span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                        <span className="text-xl font-black text-indigo-400">{item.winner.strikeRate}</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">S/R</span>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 w-full flex items-center justify-center gap-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Match Performance MVP</p>
                </div>
            </div>
        </div>
    );
}
