
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import User from "@/models/User";
import { Trophy, Users, Activity, Target, Zap, Clock, ChevronUp, Star, Medal, ArrowLeft, Crown, Flame, Award, MousePointer2 } from "lucide-react";
import Link from "next/link";

async function getGlobalLeaderboard() {
    await connectDB();
    const _ = User; // Ensure User model is registered

    const pipeline: any[] = [
        {
            $group: {
                _id: "$userId",
                totalRuns: { $sum: "$totalRuns" },
                totalMatches: { $sum: 1 },
                averageRank: { $avg: "$rank" }
            }
        },
        { $sort: { totalRuns: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
        {
            $project: {
                _id: 1,
                totalRuns: 1,
                totalMatches: 1,
                averageRank: 1,
                name: "$userDetails.name",
                email: "$userDetails.email",
                image: "$userDetails.image"
            }
        }
    ];

    const stats = await UserMatchStats.aggregate(pipeline);
    return JSON.parse(JSON.stringify(stats));
}

export default async function AdminLeaderboardPage() {
    const leaderboard = await getGlobalLeaderboard();

    return (
        <div className="min-h-screen bg-[#020617] relative selection:bg-indigo-500/30 overflow-x-hidden">
            {/* --- ADAPTIVE BACKGROUND SYSTEM --- */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* Primary Ambient Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Dynamic Surface Grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/[0.02] to-transparent pointer-events-none" />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* --- PREMIUM STICKY HEADER --- */}
                <header className="sticky top-0 z-[100] bg-slate-950/40 backdrop-blur-2xl border-b border-white/[0.05] shadow-2xl">
                    <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/10 rounded-lg">
                                    <Trophy className="w-5 h-5 text-indigo-400" />
                                </div>
                                <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                    Hall of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Legends</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-5 py-2.5 rounded-2xl backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync Active</span>
                            </div>
                            <div className="h-10 w-px bg-white/5 mx-2" />
                            <div className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/20 px-6 py-2.5 rounded-2xl shadow-xl shadow-indigo-600/5">
                                <Flame className="w-4 h-4 text-indigo-400" />
                                <div>
                                    <span className="block text-[8px] font-black text-indigo-500/60 uppercase tracking-widest leading-none mb-1">Peak Score</span>
                                    <span className="block text-xl font-black text-white leading-none tabular-nums">{leaderboard[0]?.totalRuns || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto px-6 pt-12 pb-24 w-full">
                    {/* --- THE STADIUM PODIUM --- */}
                    <section className="mb-24 relative">
                        {/* Podium Spotlights */}
                        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-full h-[300px] bg-indigo-500/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />

                        <div className="relative flex flex-col items-center gap-12 pt-10">
                            <div className="flex flex-col items-center text-center max-w-2xl">
                                <h2 className="text-5xl font-black text-white tracking-tighter mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                                    TOP <span className="text-indigo-500">PERFORMERS</span>
                                </h2>
                                <p className="text-slate-400 font-medium text-lg leading-relaxed opacity-80 italic">
                                    Recognizing the elite contributors who define the platform's competitive standard.
                                </p>
                            </div>

                            {leaderboard.length >= 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-10 w-full max-w-5xl px-4">
                                    {/* 2nd Place: Silver Halo */}
                                    <div className="order-2 md:order-1 relative group cursor-pointer animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
                                        <div className="absolute inset-0 bg-slate-400/5 blur-3xl rounded-full group-hover:bg-slate-400/10 transition-all" />
                                        <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[48px] p-8 flex flex-col items-center transition-all duration-500 group-hover:-translate-y-2 group-hover:border-slate-400/30 h-[280px] justify-center shadow-2xl">
                                            <div className="relative mb-6">
                                                <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-slate-700 p-1 overflow-hidden shadow-2xl">
                                                    {leaderboard[1].image ? <img src={leaderboard[1].image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-500">{leaderboard[1].name.charAt(0)}</div>}
                                                </div>
                                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-2xl bg-slate-400 border-4 border-[#020617] flex items-center justify-center text-slate-950 font-black text-xs shadow-xl">2</div>
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-xl font-black text-white tracking-tight mb-1 truncate max-w-[180px]">{leaderboard[1].name}</h3>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-400/10 border border-slate-400/20">
                                                    <Star className="w-3 h-3 text-slate-400 fill-slate-400" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{leaderboard[1].totalRuns} RUNS</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 1st Place: Golden Supernova */}
                                    <div className="order-1 md:order-2 relative group cursor-pointer animate-in fade-in zoom-in-95 duration-1000">
                                        {/* Golden Glow Particles */}
                                        <div className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/20 blur-[80px] rounded-full animate-pulse" />

                                        <div className="relative bg-gradient-to-b from-indigo-600/20 to-indigo-950/20 backdrop-blur-3xl border border-indigo-500/30 rounded-[64px] p-10 flex flex-col items-center transition-all duration-500 group-hover:-translate-y-4 group-hover:border-indigo-500/60 h-[360px] justify-center shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                                            <div className="absolute -top-6">
                                                <Crown className="w-12 h-12 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                                            </div>

                                            <div className="relative mb-8">
                                                <div className="w-32 h-32 rounded-[40px] bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-1.5 shadow-[0_0_30px_rgba(99,102,241,0.4)] overflow-hidden transition-all duration-500 group-hover:scale-105">
                                                    <div className="w-full h-full bg-slate-950 rounded-[34px] overflow-hidden flex items-center justify-center">
                                                        {leaderboard[0].image ? <img src={leaderboard[0].image} className="w-full h-full object-cover" /> : <div className="text-4xl font-black text-white">{leaderboard[0].name.charAt(0)}</div>}
                                                    </div>
                                                </div>
                                                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-3xl bg-yellow-500 border-8 border-[#020617]/50 backdrop-blur-xl flex items-center justify-center text-slate-950 font-black text-lg shadow-2xl">1</div>
                                            </div>

                                            <div className="text-center w-full">
                                                <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-2 truncate px-4">{leaderboard[0].name}</h3>
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-black text-indigo-400/60 uppercase tracking-[0.5em]">Ultimate Legend</span>
                                                    <div className="flex items-center gap-3 mt-2 px-6 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 shadow-inner">
                                                        <Activity className="w-4 h-4 text-indigo-400" />
                                                        <span className="text-xl font-black text-white italic">{leaderboard[0].totalRuns} <span className="text-xs text-indigo-400 not-italic">XP</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3rd Place: Bronze Halo */}
                                    <div className="order-3 relative group cursor-pointer animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                                        <div className="absolute inset-0 bg-amber-700/5 blur-3xl rounded-full group-hover:bg-amber-700/10 transition-all" />
                                        <div className="relative bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[48px] p-8 flex flex-col items-center transition-all duration-500 group-hover:-translate-y-2 group-hover:border-amber-700/30 h-[280px] justify-center shadow-2xl">
                                            <div className="relative mb-6">
                                                <div className="w-20 h-20 rounded-3xl bg-slate-800 border-2 border-amber-900/30 p-1 overflow-hidden shadow-2xl">
                                                    {leaderboard[2].image ? <img src={leaderboard[2].image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-amber-700">{leaderboard[2].name.charAt(0)}</div>}
                                                </div>
                                                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-2xl bg-amber-700 border-4 border-[#020617] flex items-center justify-center text-white font-black text-xs shadow-xl">3</div>
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-xl font-black text-white tracking-tight mb-1 truncate max-w-[180px]">{leaderboard[2].name}</h3>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-700/10 border border-amber-700/20">
                                                    <Award className="w-3 h-3 text-amber-700" />
                                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">{leaderboard[2].totalRuns} RUNS</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* --- THE ELITE PERFORMANCE INDEX --- */}
                    <div className="relative z-10 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-4">
                                <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                                <h3 className="text-xl font-black text-white tracking-widest uppercase">Elite Performance Index</h3>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500">
                                <Users className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Aggregate Records: {leaderboard.length}</span>
                            </div>
                        </div>

                        <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[40px] border border-white/[0.05] overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-white/[0.02] border-b border-white/[0.05]">
                                            <th className="px-8 py-6 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] w-24">Pos</th>
                                            <th className="px-8 py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Identity</th>
                                            <th className="px-8 py-6 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Activity</th>
                                            <th className="px-8 py-6 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Contribution Ratio</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/[0.02]">
                                        {leaderboard.map((player: any, index: number) => (
                                            <tr key={player._id} className="group relative transition-all duration-300 hover:bg-indigo-600/[0.03]">
                                                {/* Identification Cell */}
                                                <td className="px-8 py-6 text-center">
                                                    <div className={`relative inline-flex items-center justify-center w-10 h-10 rounded-2xl font-black italic text-sm transition-all duration-300 group-hover:scale-110 ${index === 0 ? "bg-yellow-500/10 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]" :
                                                        index === 1 ? "bg-slate-400/10 text-slate-400" :
                                                            index === 2 ? "bg-amber-700/10 text-amber-700" :
                                                                "bg-white/[0.03] text-slate-600"
                                                        }`}>
                                                        {index + 1}
                                                        {index < 3 && <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-current animate-pulse" />}
                                                    </div>
                                                </td>

                                                {/* Player Identity Cell */}
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative flex-shrink-0 group/avatar">
                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center p-[2px] shadow-xl transition-all duration-500 group-hover/avatar:rotate-6 ${index === 0 ? "bg-indigo-500 shadow-indigo-500/20" : "bg-white/10"
                                                                }`}>
                                                                <div className="w-full h-full bg-slate-950 rounded-[14px] overflow-hidden flex items-center justify-center">
                                                                    {player.image ? <img src={player.image} className="w-full h-full object-cover" /> : <span className="text-xs font-black text-white">{player.name.charAt(0)}</span>}
                                                                </div>
                                                            </div>
                                                            <div className="absolute inset-0 bg-indigo-500/0 group-hover/avatar:bg-indigo-500/20 rounded-2xl blur-xl transition-all opacity-0 group-hover/avatar:opacity-100" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-base font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors truncate">
                                                                {player.name}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <MousePointer2 className="w-2.5 h-2.5 opacity-50" /> {player.email}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Activity Stat Cell */}
                                                <td className="px-8 py-6 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-white/5 font-black text-xs text-indigo-400">
                                                            <Activity className="w-3.5 h-3.5" /> {player.totalMatches}
                                                        </div>
                                                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-2">Active Sessions</span>
                                                    </div>
                                                </td>

                                                {/* Contribution Score Cell */}
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-2xl font-black text-white italic tracking-tighter tabular-nums leading-none">
                                                                    {player.totalRuns}
                                                                </span>
                                                            </div>
                                                            <div className={`p-2 rounded-lg ${index === 0 ? "bg-yellow-500/10 text-yellow-500" : "bg-indigo-500/10 text-indigo-400"}`}>
                                                                <Crown className="w-4 h-4" />
                                                            </div>
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mt-2">Total Accumulated XP</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {leaderboard.length === 0 && (
                            <div className="mt-12 text-center py-32 bg-slate-950/20 border-2 border-dashed border-white/[0.05] rounded-[48px] backdrop-blur-md">
                                <Medal className="w-20 h-20 text-slate-800 mx-auto mb-8 opacity-20" />
                                <h3 className="text-3xl font-black text-white mb-3">Leaderboard Silent</h3>
                                <p className="text-slate-500 text-lg font-medium italic opacity-60">Historical performance data is currently being aggregated.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
