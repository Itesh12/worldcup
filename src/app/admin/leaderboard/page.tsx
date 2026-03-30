
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
                    <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-5 flex items-center justify-between">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="p-1.5 md:p-2 bg-indigo-500/10 rounded-lg">
                                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                                </div>
                                <h1 className="text-[1.1rem] md:text-2xl font-black text-white tracking-tighter uppercase italic leading-none">
                                    Hall of<br className="max-xs:block hidden" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Legends</span>
                                </h1>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 md:gap-4 shrink-0">
                            <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-5 py-2.5 rounded-2xl backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sync Active</span>
                            </div>
                            <div className="hidden md:block h-10 w-px bg-white/5 mx-2" />
                            <div className="flex items-center gap-2 md:gap-3 bg-indigo-600/10 border border-indigo-500/20 px-3 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-600/5">
                                <Flame className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-400" />
                                <div>
                                    <span className="block text-[7px] md:text-[8px] font-black text-indigo-500/60 uppercase tracking-widest leading-none mb-0.5 md:mb-1">Peak Score</span>
                                    <span className="block text-sm md:text-xl font-black text-white leading-none tabular-nums">{leaderboard[0]?.totalRuns || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-24 w-full">
                    {/* --- THE STADIUM PODIUM --- */}
                    <section className="mb-12 md:mb-24 relative">
                        {/* Podium Spotlights */}
                        <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-full h-[300px] bg-indigo-500/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />

                        <div className="relative flex flex-col items-center gap-8 md:gap-12 pt-6 md:pt-10">
                            <div className="flex flex-col items-center text-center max-w-2xl px-2">
                                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2 md:mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                                    TOP <span className="text-indigo-500">PERFORMERS</span>
                                </h2>
                                <p className="text-slate-400 font-medium text-sm md:text-lg leading-relaxed opacity-80 italic">
                                    Recognizing the elite contributors who define the platform's competitive standard.
                                </p>
                            </div>

                            {leaderboard.length >= 3 && (
                                <div className="grid grid-cols-1 md:grid-cols-3 items-stretch md:items-end gap-4 md:gap-10 w-full max-w-5xl px-1 md:px-4 mt-8 md:mt-0">
                                    {/* 1st Place: Golden Supernova */}
                                    <div className="order-1 md:order-2 relative group cursor-pointer animate-in fade-in zoom-in-95 duration-1000">
                                        <div className="hidden md:block absolute top-[-40px] left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/20 blur-[80px] rounded-full animate-pulse z-0" />
                                        
                                        <div className="relative z-10 bg-gradient-to-r md:bg-gradient-to-b from-indigo-600/20 to-indigo-950/20 backdrop-blur-3xl border border-indigo-500/40 rounded-3xl md:rounded-[64px] p-5 md:p-10 flex flex-row md:flex-col items-center justify-between md:justify-center transition-all duration-500 hover:border-indigo-500/60 h-auto md:h-[360px] shadow-[0_0_30px_rgba(79,70,229,0.15)]">
                                            {/* Crown */}
                                            <div className="absolute -top-5 md:-top-7 left-8 md:left-[unset] md:right-[unset]">
                                                <Crown className="w-8 h-8 md:w-14 md:h-14 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-bounce" style={{ animationDuration: '3s' }} />
                                            </div>

                                            {/* Avatar Area */}
                                            <div className="relative flex-shrink-0 mr-4 md:mr-0 md:mb-8 mt-1 md:mt-0">
                                                <div className="w-16 h-16 md:w-32 md:h-32 rounded-[18px] md:rounded-[40px] bg-gradient-to-br from-indigo-400 via-indigo-600 to-purple-600 p-[2px] md:p-1.5 shadow-[0_0_20px_rgba(99,102,241,0.4)] overflow-hidden">
                                                    <div className="w-full h-full bg-slate-950 rounded-[16px] md:rounded-[34px] overflow-hidden flex items-center justify-center">
                                                        {leaderboard[0].image ? <img src={leaderboard[0].image} className="w-full h-full object-cover" /> : <div className="text-2xl md:text-5xl font-black text-white">{leaderboard[0].name.charAt(0)}</div>}
                                                    </div>
                                                </div>
                                                <div className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-6 h-6 md:w-12 md:h-12 rounded-full md:rounded-3xl bg-yellow-500 border-4 md:border-8 border-[#020617]/80 backdrop-blur-xl flex items-center justify-center text-slate-950 font-black text-xs md:text-xl shadow-2xl">1</div>
                                            </div>

                                            {/* Text Area */}
                                            <div className="flex-1 flex flex-col items-start md:items-center min-w-0 md:w-full space-y-1 md:space-y-0">
                                                <h3 className="text-lg md:text-2xl font-black text-white tracking-widest uppercase truncate w-full md:text-center">{leaderboard[0].name}</h3>
                                                <span className="text-[9px] md:text-[10px] font-black text-indigo-400/80 uppercase tracking-widest md:tracking-[0.4em]">Ultimate Legend</span>
                                            </div>

                                            {/* Score Area */}
                                            <div className="flex-shrink-0 ml-3 md:ml-0 md:mt-4">
                                                <div className="flex flex-col md:flex-row items-end md:items-center gap-1 md:gap-3 px-3 py-1.5 md:px-6 md:py-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                                                    <Activity className="hidden md:block w-4 h-4 text-indigo-400 shrink-0" />
                                                    <span className="text-xl md:text-2xl font-black text-white tracking-tighter italic leading-none">{leaderboard[0].totalRuns} <span className="text-[10px] md:text-xs text-indigo-400 tracking-normal not-italic ml-0.5">XP</span></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2nd Place: Silver Halo */}
                                    <div className="order-2 md:order-1 relative group cursor-pointer animate-in fade-in slide-in-from-left-8 duration-1000 delay-300">
                                        <div className="hidden md:block absolute inset-0 bg-slate-400/5 blur-3xl rounded-full z-0" />
                                        
                                        <div className="relative z-10 bg-slate-900/60 md:bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-[48px] p-4 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center transition-all duration-500 hover:border-slate-400/30 h-auto md:h-[280px] shadow-2xl">
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0 mr-4 md:mr-0 md:mb-6">
                                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-slate-800 border-2 border-slate-700/50 p-1 overflow-hidden shadow-2xl">
                                                    {leaderboard[1].image ? <img src={leaderboard[1].image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-black text-slate-500">{leaderboard[1].name.charAt(0)}</div>}
                                                </div>
                                                <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 rounded-full md:rounded-2xl bg-slate-400 border-4 border-[#020617]/80 flex items-center justify-center text-slate-950 font-black text-[10px] md:text-xs shadow-xl">2</div>
                                            </div>

                                            {/* Text Area */}
                                            <div className="flex-1 flex flex-col items-start md:items-center min-w-0 md:w-full">
                                                <h3 className="text-base md:text-xl font-black text-white tracking-tight truncate w-full md:text-center md:mb-2">{leaderboard[1].name}</h3>
                                                <div className="md:hidden mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-400/10 border border-slate-400/20">
                                                    <Star className="w-2.5 h-2.5 text-slate-400 fill-slate-400" />
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{leaderboard[1].totalRuns} RUNS</span>
                                                </div>
                                            </div>

                                            {/* Score Area (Desktop Only layout component) */}
                                            <div className="hidden md:inline-flex mt-auto items-center gap-2 px-3 py-1.5 rounded-full bg-slate-400/10 border border-slate-400/20">
                                                <Star className="w-3 h-3 text-slate-400 fill-slate-400 shrink-0" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{leaderboard[1].totalRuns} RUNS</span>
                                            </div>

                                            {/* Mobile right aligned element to balance standard rows */}
                                            <div className="md:hidden flex-shrink-0 ml-3 text-right">
                                                <span className="text-lg font-black text-white tracking-tighter italic">{leaderboard[1].totalRuns}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3rd Place: Bronze Halo */}
                                    <div className="order-3 relative group cursor-pointer animate-in fade-in slide-in-from-right-8 duration-1000 delay-300">
                                        <div className="hidden md:block absolute inset-0 bg-amber-700/5 blur-3xl rounded-full z-0" />
                                        
                                        <div className="relative z-10 bg-slate-900/60 md:bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-[48px] p-4 md:p-8 flex flex-row md:flex-col items-center justify-between md:justify-center transition-all duration-500 hover:border-amber-700/30 h-auto md:h-[280px] shadow-2xl">
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0 mr-4 md:mr-0 md:mb-6">
                                                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-slate-800 border-2 border-amber-900/30 p-1 overflow-hidden shadow-2xl">
                                                    {leaderboard[2].image ? <img src={leaderboard[2].image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-black text-amber-500">{leaderboard[2].name.charAt(0)}</div>}
                                                </div>
                                                <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 rounded-full md:rounded-2xl bg-amber-600 border-4 border-[#020617]/80 flex items-center justify-center text-white font-black text-[10px] md:text-xs shadow-xl">3</div>
                                            </div>

                                            {/* Text Area */}
                                            <div className="flex-1 flex flex-col items-start md:items-center min-w-0 md:w-full">
                                                <h3 className="text-base md:text-xl font-black text-white tracking-tight truncate w-full md:text-center md:mb-2">{leaderboard[2].name}</h3>
                                                <div className="md:hidden mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-700/20 border border-amber-700/30">
                                                    <Award className="w-2.5 h-2.5 text-amber-500" />
                                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">{leaderboard[2].totalRuns} RUNS</span>
                                                </div>
                                            </div>

                                            {/* Score Area (Desktop) */}
                                            <div className="hidden md:inline-flex mt-auto items-center gap-2 px-3 py-1.5 rounded-full bg-amber-700/20 border border-amber-700/30">
                                                <Award className="w-3 h-3 text-amber-500 shrink-0" />
                                                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em]">{leaderboard[2].totalRuns} RUNS</span>
                                            </div>

                                            {/* Mobile right aligned element */}
                                            <div className="md:hidden flex-shrink-0 ml-3 text-right">
                                                <span className="text-lg font-black text-white tracking-tighter italic">{leaderboard[2].totalRuns}</span>
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

                        {/* Mobile Card Layout */}
                        <div className="md:hidden space-y-4">
                            {leaderboard.map((player: any, index: number) => (
                                <div
                                    key={player._id}
                                    className="bg-slate-950/40 backdrop-blur-3xl rounded-3xl border border-white/[0.05] p-6 flex items-center justify-between gap-4"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        {/* Rank Indicator */}
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-sm ${index === 0 ? "bg-yellow-500/10 text-yellow-500" :
                                            index === 1 ? "bg-slate-400/10 text-slate-400" :
                                                index === 2 ? "bg-amber-700/10 text-amber-700" :
                                                    "bg-white/[0.03] text-slate-600"
                                            }`}>
                                            {index + 1}
                                        </div>

                                        {/* Identity */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-[2px] ${index === 0 ? "bg-indigo-500 shadow-lg shadow-indigo-500/20" : "bg-white/10"
                                                }`}>
                                                <div className="w-full h-full bg-slate-950 rounded-[10px] overflow-hidden flex items-center justify-center">
                                                    {player.image ? <img src={player.image} className="w-full h-full object-cover" /> : <span className="text-xs font-black text-white">{player.name.charAt(0)}</span>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-black text-white tracking-tight truncate">{player.name}</span>
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{player.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-white italic tracking-tighter tabular-nums">{player.totalRuns}</span>
                                            <Crown className={`w-4 h-4 ${index === 0 ? "text-yellow-500" : "text-indigo-400"}`} />
                                        </div>
                                        <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">XP Points</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table Layout */}
                        <div className="hidden md:block bg-slate-950/40 backdrop-blur-3xl rounded-[40px] border border-white/[0.05] overflow-hidden shadow-2xl">
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
