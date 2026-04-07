
"use client";

import { useEffect, useState } from "react";
import { Trophy, ArrowLeft, PartyPopper, Medal, Star, Activity } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function HallOfFamePage() {
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";
    const [winners, setWinners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [winCounts, setWinCounts] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const fetchAllWinners = async () => {
            try {
                const res = await fetch('/api/matches/winners?limit=0');
                const data = await res.json();
                if (res.ok) {
                    setWinners(data);
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

    const sortedUniqueWinners = Object.entries(winCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-[#050B14] pb-20 relative overflow-x-hidden">
            {/* 1. IMMERSIVE BACKDROP: Tactical Grid & Victory Beams */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,_rgba(79,70,229,0.15),_transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,_transparent_1px),_linear-gradient(90deg,rgba(255,255,255,0.02)_1px,_transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
            </div>

            <header className="sticky top-0 z-40 bg-[#050B14]/90 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <Link 
                        href={`/dashboard${isPlayerView ? "?view=player" : ""}`} 
                        className="flex items-center gap-2 group px-4 py-2 bg-white/5 rounded-xl border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Command Return</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-indigo-500" />
                        <h1 className="text-lg font-black text-white uppercase tracking-tighter">WORLD CUP <span className="text-indigo-500 italic">HUB</span></h1>
                    </div>
                    <div className="w-24 hidden md:block" />
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-12 md:pt-20">
                <div className="text-center mb-16 relative">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-6 group animate-in zoom-in-50 duration-500">
                        <Star className="w-4 h-4 text-indigo-400 group-hover:rotate-180 transition-transform duration-700" />
                        <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em]">The Arena of Legends</span>
                    </div>
                    <h2 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-4 filter drop-shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                        Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 italic">Fame</span>
                    </h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] md:text-sm max-w-xl mx-auto">Honoring the ultimate gladiators who have dominated the World Cup arena</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24">
                        <Trophy className="w-16 h-16 text-indigo-500 animate-bounce mb-6" />
                        <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-24">
                        {/* 2. THE PRESTIGE PODIUM: (1st, 2nd, 3rd) */}
                        {sortedUniqueWinners.length > 0 && (
                            <section className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                <div className="flex items-center gap-4 mb-12 justify-center md:justify-start">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Most Dominant Players</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end">
                                    {/* 2nd Place */}
                                    {sortedUniqueWinners[1] && (
                                        <PodiumSlot rank={2} data={sortedUniqueWinners[1]} winners={winners} />
                                    )}
                                    {/* 1st Place */}
                                    {sortedUniqueWinners[0] && (
                                        <PodiumSlot rank={1} data={sortedUniqueWinners[0]} winners={winners} />
                                    )}
                                    {/* 3rd Place */}
                                    {sortedUniqueWinners[2] && (
                                        <PodiumSlot rank={3} data={sortedUniqueWinners[2]} winners={winners} />
                                    )}
                                </div>
                                
                                {/* 4th & 5th - Smaller Rank Pills */}
                                {sortedUniqueWinners.slice(3).length > 0 && (
                                    <div className="mt-8 flex justify-center md:justify-start gap-4 flex-wrap">
                                        {sortedUniqueWinners.slice(3).map(([uId, count], idx) => {
                                            const winner = winners.find(w => w.winner.userId === uId);
                                            return (
                                                <div key={uId} className="flex items-center gap-4 px-6 py-3 bg-slate-950/60 border border-white/5 rounded-2xl">
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RANK {idx + 4}</span>
                                                    <span className="text-sm font-black text-white">{winner?.winner.name}</span>
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{count} WINS</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* 3. LEGEND CARDS GRID */}
                        <section className="animate-in fade-in duration-1000">
                            <div className="flex items-center gap-4 mb-12 justify-center md:justify-start">
                                <Activity className="w-6 h-6 text-indigo-500" />
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Recent match victors</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {winners.map((item, idx) => (
                                    <WinnerCard key={idx} item={item} totalWins={winCounts[item.winner.userId] || 0} />
                                ))}
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

function PodiumSlot({ rank, data, winners }: { rank: 1 | 2 | 3, data: [string, any], winners: any[] }) {
    const [uId, count] = data;
    const winner = winners.find(w => w.winner.userId === uId);
    const styles = {
        1: { border: 'border-yellow-500/30', bg: 'bg-yellow-500/10', text: 'text-yellow-500', height: 'md:h-[320px]', shadow: 'shadow-yellow-500/20' },
        2: { border: 'border-slate-300/30', bg: 'bg-slate-300/10', text: 'text-slate-300', height: 'md:h-[260px]', shadow: 'shadow-slate-300/20' },
        3: { border: 'border-orange-700/30', bg: 'bg-orange-700/10', text: 'text-orange-700', height: 'md:h-[220px]', shadow: 'shadow-orange-700/20' }
    }[rank];

    return (
        <div className={`relative flex flex-col items-center p-8 rounded-[3rem] border ${styles.border} ${styles.bg} ${styles.height} transition-all hover:scale-[1.02] shadow-2xl ${styles.shadow} order-first ${rank === 1 ? 'md:order-none' : rank === 2 ? 'md:order-first' : 'md:order-last'}`}>
            <div className={`absolute -top-6 rounded-2xl px-6 py-2 bg-slate-950 border ${styles.border} font-black uppercase tracking-[0.3em] ${styles.text}`}>
                Rank 0{rank}
            </div>
            
            <div className="relative mb-6 mt-4">
                <div className={`w-28 h-28 rounded-full p-1 bg-gradient-to-tr ${rank === 1 ? 'from-yellow-400 to-amber-600' : 'from-slate-400 to-slate-600'} shadow-2xl relative z-10`}>
                    <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden border-4 border-[#050B14]">
                        {winner?.winner.image ? (
                            <img src={winner.winner.image} alt={winner.winner.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="text-3xl font-black text-white">{winner?.winner.name[0]}</div>
                        )}
                    </div>
                </div>
                <div className={`absolute inset-0 blur-[40px] opacity-20 ${styles.bg} rounded-full`} />
            </div>

            <div className="text-center mt-auto">
                <h4 className="text-2xl font-black text-white mb-2">{winner?.winner.name}</h4>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Dominance Record</span>
                    <span className={`text-4xl font-black italic tabular-nums ${styles.text}`}>{count} <span className="text-sm not-italic font-black opacity-50 uppercase tracking-widest">Wins</span></span>
                </div>
            </div>
        </div>
    );
}

function WinnerCard({ item, totalWins }: { item: any; totalWins: number }) {
    return (
        <div className="group relative overflow-hidden bg-slate-950/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 hover:border-indigo-500/30 transition-all duration-500 shadow-2xl h-full flex flex-col">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-600/5 blur-[80px] rounded-full group-hover:bg-indigo-600/10 transition-all duration-500" />

            <div className="relative z-10 flex items-center justify-between gap-4 mb-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{new Date(item.match.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight">
                        {item.match.teams[0]?.shortName} <span className="text-indigo-500 font-bold italic">VS</span> {item.match.teams[1]?.shortName}
                    </h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-all">
                    <Medal className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-[0_0_30px_rgba(99,102,241,0.2)] group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-500">
                        <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden border-4 border-[#050B14]">
                            {item.winner.image ? (
                                <img src={item.winner.image} alt={item.winner.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-2xl font-black text-white">{item.winner.name[0]}</div>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-xl border-[3px] border-[#050B14] shadow-2xl">
                        {totalWins} {totalWins === 1 ? 'WIN' : 'WINS'}
                    </div>
                </div>

                <h4 className="text-2xl font-black text-white mb-2 group-hover:text-indigo-400 transition-colors text-center tracking-tight">{item.winner.name}</h4>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Arena Conqueror</p>

                <div className="grid grid-cols-2 gap-4 w-full mt-auto">
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center hover:bg-white/10 transition-all group/stat">
                        <span className="text-2xl font-black text-white italic tabular-nums group-hover/stat:scale-110 transition-transform">{item.winner.score}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Runs</span>
                    </div>
                    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col items-center hover:bg-white/10 transition-all group/stat">
                        <span className="text-2xl font-black text-indigo-400 italic tabular-nums group-hover/stat:scale-110 transition-transform">{item.winner.strikeRate}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">S/R</span>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 w-full flex items-center justify-center gap-3">
                    <Activity className="w-3.5 h-3.5 text-indigo-500/50" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Match Performance record</p>
                </div>
            </div>
        </div>
    );
}

