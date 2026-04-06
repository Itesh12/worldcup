"use client";

import React, { useEffect, useState } from "react";
import { X, Trophy, Users, Zap, Activity, Info, Star, ChevronRight, Award, Lock, ShieldCheck, Target } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";

interface ArenaDetailViewProps {
    isOpen: boolean;
    onClose: () => void;
    arenaId: string;
    matchId: string;
}

export function ArenaDetailView({ isOpen, onClose, arenaId, matchId }: ArenaDetailViewProps) {
    const { showToast } = useToast();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<'leaderboard' | 'participants'>('leaderboard');

    useEffect(() => {
        if (isOpen && arenaId) {
            fetchArenaDetails();
        }
    }, [isOpen, arenaId]);

    const fetchArenaDetails = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/arenas/${arenaId}/details`);
            const result = await res.json();
            if (res.ok) {
                setData(result);
            } else {
                showToast(result.message || "Failed to load arena details", "error");
            }
        } catch (err) {
            console.error("Arena detail fetch error:", err);
            showToast("Connectivity issue. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl max-h-[80vh] bg-[#0A0F1C] border border-white/10 rounded-[1.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(99,102,241,0.1)]">
                {/* Background Effects */}
                <div className="absolute -top-48 -left-48 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

                {/* Header Container */}
                <div className="relative z-10 p-4 md:p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/20">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-600/10">
                            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight">{data?.arena?.name || "Arena Details"}</h2>
                                {data?.arena?.isPrivate && (
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-md text-[8px] font-black uppercase tracking-widest">Private</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 md:mt-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                    <Users className="w-3 h-3" /> {data?.participants?.length || 0} Participants
                                </span>
                                <div className="w-1 h-1 rounded-full bg-slate-800" />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${data?.arena?.status === 'completed' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                                    {data?.arena?.status || "Loading..."}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 md:p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all active:scale-95 group"
                    >
                        <X className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto relative z-10 scrollbar-hide">
                    {loading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center gap-4">
                            <Spinner />
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] font-mono">Syncing Arena Standings...</p>
                        </div>
                    ) : (
                        <div className="p-4 md:p-6 space-y-6">
                            {/* Navigation Tabs */}
                            <div className="flex items-center gap-8 border-b border-white/5 mx-2 pb-0.5">
                                <button
                                    onClick={() => setActiveSection('leaderboard')}
                                    className={`relative pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSection === 'leaderboard' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Arena Standings
                                    {activeSection === 'leaderboard' && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveSection('participants')}
                                    className={`relative pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeSection === 'participants' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Participant List
                                    {activeSection === 'participants' && (
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] rounded-full" />
                                    )}
                                </button>
                            </div>

                            {/* Section: Leaderboard */}
                            {activeSection === 'leaderboard' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                    <div className="grid gap-3 md:gap-4">
                                        {data.leaderboard.length > 0 ? data.leaderboard.map((entry: any, idx: number) => (
                                            <div
                                                key={entry.user._id}
                                                className={`relative overflow-hidden bg-slate-900/30 border ${idx === 0 ? 'border-yellow-500/20 bg-yellow-500/5' :
                                                    idx === 1 ? 'border-slate-400/20' :
                                                        idx === 2 ? 'border-orange-500/20' : 'border-white/5'
                                                    } rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-5 group hover:border-indigo-500/30 transition-all backdrop-blur-md shadow-xl`}
                                            >
                                                {/* Left Side: Rank & User */}
                                                <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-black text-sm md:text-lg ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' :
                                                        idx === 1 ? 'bg-slate-400 text-black' :
                                                            idx === 2 ? 'bg-orange-600 text-white' : 'bg-slate-800/80 text-slate-500 border border-white/5'
                                                        }`}>
                                                        #{entry.rank}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full p-[1.5px] bg-gradient-to-tr from-indigo-500/50 to-purple-500/50">
                                                            <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                                                                {entry.user.image ? (
                                                                    <img src={entry.user.image} alt={entry.user.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-slate-700 font-black">?</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm md:text-base font-black text-white uppercase tracking-tight truncate max-w-[120px] md:max-w-none">{entry.user.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Star className={`w-3 h-3 ${idx < 3 ? 'text-yellow-500 animate-pulse' : 'text-slate-600'}`} />
                                                                <span className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest">{entry.slots.length} Global Slot Assignments</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right Side: Tie-breaker Stats */}
                                                <div className="flex items-center gap-4 sm:gap-8 md:gap-10 w-full md:w-auto justify-between md:justify-end px-3 md:px-0 py-3 md:py-0 border-t md:border-t-0 border-white/5">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Runs</span>
                                                        <span className="text-lg md:text-2xl font-black text-white">{entry.totalRuns}</span>
                                                    </div>
                                                    <div className="w-px h-8 bg-white/5 hidden md:block" />
                                                    <div className="flex flex-col items-center min-w-[50px]">
                                                        <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Strike Rate</span>
                                                        <span className={`text-xs md:text-sm font-black ${parseFloat(entry.strikeRate) > 150 ? 'text-indigo-400' : 'text-slate-400'}`}>{entry.strikeRate}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center min-w-[40px]">
                                                        <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Boundaries</span>
                                                        <span className="text-xs md:text-sm font-black text-slate-400">{(entry.totalFours || 0) + (entry.totalSixes || 0)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                                <p className="text-slate-600 uppercase font-black text-[10px] tracking-[0.3em]">No scores recorded for this arena.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Section: Participants */}
                            {activeSection === 'participants' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {data.participants.map((p: any, idx: number) => (
                                            <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-800/60 transition-all flex items-center justify-between group h-full">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center overflow-hidden border border-white/5">
                                                        {p.image ? (
                                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                        ) : (
                                                            <div className="text-[10px] font-black text-slate-600">??</div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-black text-white uppercase truncate">{p.name}</h4>
                                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                                                            Innings {p.innings} <span className="w-0.5 h-0.5 bg-slate-800" /> Pos {p.position || "TBA"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Playing As</span>
                                                    <span className="text-[10px] font-black text-indigo-500/80 uppercase italic truncate max-w-[100px] text-right">
                                                        {p.playerName || "LOCKED"}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Credits */}
                <div className="relative z-10 p-6 bg-slate-950 border-t border-white/5 text-center">
                    <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">Arena Core v2.0 • Data Sync Live</p>
                </div>
            </div>
        </div>
    );
}
