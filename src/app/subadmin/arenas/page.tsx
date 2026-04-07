"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
    Swords, 
    Plus, 
    Calendar, 
    Clock, 
    Users, 
    IndianRupee, 
    Trophy, 
    History,
    Zap,
    ChevronRight,
    Search,
    Filter,
    RefreshCw,
    ChevronUp,
    ChevronDown,
    CheckCircle2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { Spinner } from "@/components/ui/Spinner";
import { CreateArenaModal } from "@/components/dashboard/CreateArenaModal";
import { ArenaDetailView } from "@/components/dashboard/ArenaDetailView";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function MyArenasPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    
    const [arenas, setArenas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});
    const [selectedArenaForView, setSelectedArenaForView] = useState<{ arenaId: string; matchId: string } | null>(null);
    const [settling, setSettling] = useState<string | null>(null);

    const fetchArenas = async () => {
        try {
            const res = await fetch("/api/subadmin/arenas");
            if (res.ok) {
                const data = await res.json();
                setArenas(data);
                
                // Auto-expand first match
                if (data.length > 0 && data[0].matchId?._id) {
                    setExpandedMatches({ [data[0].matchId._id]: true });
                }
            }
        } catch (err) {
            showToast("Failed to sync arena frequency", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const role = (session?.user as any)?.role;
            if (role !== "subadmin" && role !== "admin") {
                router.push("/dashboard");
            } else {
                fetchArenas();
            }
        }
    }, [status, session]);

    // Match Grouping Logic
    const matchGroups = useMemo(() => {
        const groups: Record<string, { match: any, arenas: any[] }> = {};
        
        arenas.forEach(arena => {
            if (!arena.matchId) return;
            const mId = arena.matchId._id;
            if (!groups[mId]) {
                groups[mId] = { match: arena.matchId, arenas: [] };
            }
            groups[mId].arenas.push(arena);
        });

        return Object.values(groups).sort((a, b) => new Date(a.match.startTime).getTime() - new Date(b.match.startTime).getTime());
    }, [arenas]);

    const toggleMatch = (mId: string) => {
        setExpandedMatches(prev => ({ ...prev, [mId]: !prev[mId] }));
    };

    if (loading && arenas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Match Hierarchy...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 space-y-10 max-w-[1600px] mx-auto pb-24 lg:pb-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/20 shadow-lg shadow-purple-500/10">
                            <Trophy className="w-5 h-5 text-purple-400" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                            FRANCHISE <span className="text-purple-500">ARENAS</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] px-1 italic">Organized By Match Schedule</p>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => {
                            setLoading(true);
                            fetchArenas();
                        }}
                        className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-95 hover:bg-white/10"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-purple-600/20 active:scale-95 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                        Host New Arena
                    </button>
                </div>
            </div>

            {/* Match-Based Grid */}
            <div className="space-y-6">
                {matchGroups.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] gap-6">
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-600 uppercase tracking-[0.3em]">No Active Operations Found</p>
                        </div>
                    </div>
                ) : (
                    matchGroups.map((group) => (
                        <div key={group.match._id} className="space-y-4">
                            {/* Match Card Header */}
                            <div 
                                onClick={() => toggleMatch(group.match._id)}
                                className="group cursor-pointer bg-[#0A0F1C] border border-white/5 rounded-3xl p-5 hover:border-purple-500/30 transition-all duration-500"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center -space-x-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center z-10 shadow-xl group-hover:border-purple-500/50 transition-colors">
                                                <span className="text-sm font-black text-white italic">{group.match.teams[0].shortName}</span>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center z-10 shadow-xl group-hover:border-purple-500/50 transition-colors">
                                                <span className="text-sm font-black text-white italic">{group.match.teams[1].shortName}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-md font-black text-white uppercase tracking-tighter leading-none mb-1 italic">
                                                {group.match.teams[0].name} <span className="text-purple-500 font-black">VS</span> {group.match.teams[1].name}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{group.match.seriesName}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                <span className="flex items-center gap-1.5 text-[8px] font-black text-purple-400 uppercase tracking-widest">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(group.match.startTime).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="hidden sm:block text-center border-x border-white/5 px-8">
                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Your Arenas</span>
                                            <span className="text-2xl font-black text-white tracking-tighter">{group.arenas.length}</span>
                                        </div>
                                        {expandedMatches[group.match._id] ? (
                                            <ChevronUp className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Arenas Sub-Grid */}
                            <AnimatePresence>
                                {expandedMatches[group.match._id] && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-2 pb-6">
                                            {group.arenas.map((arena: any) => (
                                                <div 
                                                    key={arena._id}
                                                    onClick={() => setSelectedArenaForView({ arenaId: arena._id, matchId: arena.matchId._id })}
                                                    className="group relative bg-[#0A0F1C] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-2xl p-6 cursor-pointer"
                                                >
                                                    <div className="flex items-start justify-between gap-4 mb-5">
                                                        <div className="flex-1 overflow-hidden">
                                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                <span className="px-2 py-0.5 rounded bg-purple-500/10 text-[8px] font-black text-purple-400 uppercase tracking-widest border border-purple-500/20">
                                                                    HOSTED UNIT
                                                                </span>
                                                            </div>
                                                            <h3 className="text-lg font-black text-white italic uppercase tracking-tight leading-tight truncate">
                                                                {arena.name}
                                                            </h3>
                                                        </div>
                                                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Swords className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Stake</span>
                                                            <span className="block text-xs font-black text-white italic">₹{arena.entryFee}</span>
                                                        </div>
                                                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Fill</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs font-black text-purple-400">{arena.slotsCount}</span>
                                                                <span className="text-[9px] font-bold text-slate-600">/ {arena.maxSlots}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Yield</span>
                                                            <span className="block text-xs font-black text-emerald-400">
                                                                +₹{((arena.slotsCount * arena.entryFee) * (arena.organizerCommissionPercentage / 100)).toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedArenaForView({ arenaId: arena._id, matchId: arena.matchId?._id });
                                                        }}
                                                        className="mt-6 w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group/btn"
                                                    >
                                                        <span className="text-[9px] font-black text-slate-400 group-hover/btn:text-white uppercase tracking-[0.2em] transition-colors">Audit Grid</span>
                                                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover/btn:text-purple-400 group-hover/btn:translate-x-1 transition-all" />
                                                    </button>

                                                    {['finished', 'completed', 'result', 'settled'].includes(arena.matchId.status) && arena.status !== 'completed' && (
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (settling) return;
                                                                try {
                                                                    setSettling(arena._id);
                                                                    const res = await fetch(`/api/admin/arenas/${arena._id}/settle`, { method: 'POST' });
                                                                    if (res.ok) {
                                                                        showToast("Arena Fixed & Settled", "success");
                                                                        fetchArenas();
                                                                    } else {
                                                                        const data = await res.json();
                                                                        showToast(data.message || "Settlement Failed", "error");
                                                                    }
                                                                } catch (err) {
                                                                    showToast("Sync Error", "error");
                                                                } finally {
                                                                    setSettling(null);
                                                                }
                                                            }}
                                                            className="mt-3 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                                        >
                                                            {settling === arena._id ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Reconcile & Settle Prize
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            <CreateArenaModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                matchId="" 
                matchName=""
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchArenas();
                }}
            />

            {/* Arena Detail View Modal */}
            <ArenaDetailView 
                isOpen={!!selectedArenaForView}
                onClose={() => setSelectedArenaForView(null)}
                arenaId={selectedArenaForView?.arenaId || ""}
                matchId={selectedArenaForView?.matchId || ""}
            />
        </div>
    );
}
