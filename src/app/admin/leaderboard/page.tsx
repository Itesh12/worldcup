
import connectDB from "@/lib/db";
import UserMatchStats from "@/models/UserMatchStats";
import User from "@/models/User";
import { Trophy, Users, Activity, Target, Zap, Clock, ChevronUp, Star, Medal } from "lucide-react";

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
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative pb-10 mt-2">
            {/* Subtler Ambient Background Glow */}
            <div className="absolute -top-20 left-0 w-[600px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/20 p-6 rounded-[24px] border border-white/5 backdrop-blur-xl shadow-xl">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                        <Trophy className="w-6 h-6 text-indigo-500" />
                        Global Leaderboard
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm font-medium">Monitoring peak platform performance and player statistics.</p>
                </div>
                <div className="flex items-center gap-6">
                    <div className="bg-indigo-500/5 border border-indigo-500/20 px-4 py-2.5 rounded-xl flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/10">
                            <Target className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Top Runs</span>
                            <span className="block text-lg font-black text-white leading-none">{leaderboard[0]?.totalRuns || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Compact Podium Section */}
            {leaderboard.length >= 3 && (
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-4 items-end max-w-4xl mx-auto">
                    {/* 2nd Place */}
                    <div className="relative order-2 md:order-1 flex flex-col items-center">
                        <div className="bg-slate-950/20 p-4 pb-6 rounded-t-[32px] border border-white/5 border-b-0 backdrop-blur-xl w-full flex flex-col items-center">
                            <div className="relative mb-3 pt-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black text-slate-300 shadow-xl overflow-hidden">
                                    {leaderboard[1].image ? <img src={leaderboard[1].image} className="w-full h-full object-cover" /> : leaderboard[1].name.charAt(0)}
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-slate-400 border-2 border-slate-950 rounded-full flex items-center justify-center text-[8px] font-black text-slate-950 shadow-lg">2</div>
                            </div>
                            <div className="text-sm font-black text-white truncate max-w-full px-2">{leaderboard[1].name}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{leaderboard[1].totalRuns} Runs</div>
                        </div>
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />
                    </div>

                    {/* 1st Place */}
                    <div className="relative order-1 md:order-2 flex flex-col items-center">
                        <div className="absolute -top-4 w-full flex justify-center z-20">
                            <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                        </div>
                        <div className="bg-indigo-600/10 p-5 pb-8 rounded-t-[40px] border border-indigo-500/20 border-b-0 backdrop-blur-xl w-full flex flex-col items-center shadow-2xl shadow-indigo-600/10">
                            <div className="relative mb-3 pt-6">
                                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-indigo-600 to-purple-600 p-[2px] shadow-2xl overflow-hidden group">
                                    <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-xl font-black text-white group-hover:bg-indigo-600 transition-colors">
                                        {leaderboard[0].image ? <img src={leaderboard[0].image} className="w-full h-full object-cover" /> : leaderboard[0].name.charAt(0)}
                                    </div>
                                </div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black text-slate-950 shadow-lg animate-pulse">1</div>
                            </div>
                            <div className="text-base font-black text-white truncate max-w-full px-2">{leaderboard[0].name}</div>
                            <div className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em]">{leaderboard[0].totalRuns} Runs</div>
                        </div>
                        <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
                    </div>

                    {/* 3rd Place */}
                    <div className="relative order-3 flex flex-col items-center">
                        <div className="bg-slate-950/20 p-4 pb-6 rounded-t-[32px] border border-white/5 border-b-0 backdrop-blur-xl w-full flex flex-col items-center">
                            <div className="relative mb-3 pt-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black text-slate-300 shadow-xl overflow-hidden">
                                    {leaderboard[2].image ? <img src={leaderboard[2].image} className="w-full h-full object-cover" /> : leaderboard[2].name.charAt(0)}
                                </div>
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-700 border-2 border-slate-950 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg">3</div>
                            </div>
                            <div className="text-sm font-black text-white truncate max-w-full px-2">{leaderboard[2].name}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{leaderboard[2].totalRuns} Runs</div>
                        </div>
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                    </div>
                </div>
            )}

            {/* Leaderboard Table Grid */}
            <div className="relative z-10 bg-slate-950/20 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-950/40 border-b border-white/5">
                                <th className="px-6 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.25em] w-20">Rank</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Player Identity</th>
                                <th className="px-6 py-4 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Fixtures</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Performance Profile</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {leaderboard.map((player: any, index: number) => (
                                <tr key={player._id} className="transition-all duration-200 group hover:bg-white/[0.02]">
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-black text-xs ${index === 0 ? "bg-yellow-500/10 text-yellow-500" :
                                                index === 1 ? "bg-slate-400/10 text-slate-300" :
                                                    index === 2 ? "bg-orange-700/10 text-orange-500" :
                                                        "text-slate-600"
                                            }`}>
                                            #{index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-shrink-0">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[10px] shadow-lg overflow-hidden border border-white/5 ${index === 0 ? "bg-indigo-600 shadow-indigo-600/20" : "bg-slate-800"
                                                    }`}>
                                                    {player.image ? <img src={player.image} className="w-full h-full object-cover" /> : player.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors truncate">
                                                    {player.name}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{player.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-slate-400">
                                            <Activity className="w-2.5 h-2.5 opacity-50" /> {player.totalMatches} <span className="text-[8px] opacity-40">GP</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 text-base font-black text-white tracking-tight">
                                                {player.totalRuns}
                                                <Star className={`w-3 h-3 ${index === 0 ? "text-yellow-500 fill-yellow-500" : "text-slate-600"}`} />
                                            </div>
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Total Scored Runs</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {leaderboard.length === 0 && (
                <div className="relative z-10 text-center py-24 bg-slate-950/20 border border-dashed border-white/5 rounded-[32px] backdrop-blur-md">
                    <Medal className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-black text-white mb-1 tracking-tight">Leaderboard Silent</h3>
                    <p className="text-slate-500 text-sm font-medium italic">No player performance records have been aggregated yet.</p>
                </div>
            )}
        </div>
    );
}
