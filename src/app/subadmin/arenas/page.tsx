"use client";

import React, { useEffect, useState } from "react";
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
    RefreshCw
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { Spinner } from "@/components/ui/Spinner";
import { CreateArenaModal } from "@/components/dashboard/CreateArenaModal";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function MyArenasPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    
    const [arenas, setArenas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchArenas = async () => {
        try {
            const res = await fetch("/api/subadmin/arenas");
            if (res.ok) {
                const data = await res.json();
                setArenas(data);
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Arena Grid...</p>
            </div>
        );
    }

    // Grouping logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayArenas = arenas.filter(a => new Date(a.createdAt) >= today);
    const pastArenas = arenas.filter(a => new Date(a.createdAt) < today);

    const ArenaCard = ({ arena }: { arena: any }) => (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-[#0A0F1C] border border-white/5 rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 shadow-2xl"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/[0.02] to-transparent pointer-events-none" />
            
            <div className="p-6 space-y-4">
                {/* Header: Match Info */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-[8px] font-black text-purple-400 uppercase tracking-widest border border-purple-500/20">
                                {arena.matchId?.seriesName || 'World Cup'}
                            </span>
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(arena.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h3 className="text-lg font-black text-white italic uppercase tracking-tight leading-tight group-hover:text-purple-400 transition-colors truncate">
                            {arena.name}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 truncate">
                            {arena.matchId?.teams[0].shortName} vs {arena.matchId?.teams[1].shortName}
                        </p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Swords className="w-5 h-5 text-purple-400" />
                    </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Stake</span>
                        <span className="block text-sm font-black text-white">₹{arena.entryFee}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Fill Rate</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-purple-400">{arena.slotsCount}</span>
                            <span className="text-[9px] font-bold text-slate-600">/ {arena.maxSlots}</span>
                        </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Yield</span>
                        <span className="block text-sm font-black text-emerald-400">
                            +₹{((arena.slotsCount * arena.entryFee) * (arena.organizerCommissionPercentage / 100)).toFixed(1)}
                        </span>
                    </div>
                </div>

                {/* Footer Action */}
                <Link 
                    href={`/matches/${arena.matchId?._id}`}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all group/btn"
                >
                    <span className="text-[9px] font-black text-slate-400 group-hover/btn:text-white uppercase tracking-[0.2em] transition-colors">Audit Arena Data</span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover/btn:text-purple-400 group-hover/btn:translate-x-1 transition-all" />
                </Link>
            </div>
        </motion.div>
    );

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
                            MY <span className="text-purple-500">ARENAS</span>
                        </h1>
                    </div>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] px-1">Host Operations & Portfolio</p>
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

            {/* Content Tabs */}
            <div className="space-y-12">
                {/* Active Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-purple-500/50 to-transparent" />
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5">
                            <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Operations (Today)</span>
                        </div>
                        <div className="h-px flex-1 bg-gradient-to-l from-purple-500/50 to-transparent" />
                    </div>

                    {todayArenas.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] gap-6">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center opacity-40">
                                <Search className="w-10 h-10 text-slate-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-slate-600 uppercase tracking-widest">No Active Units Today</p>
                                <button 
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="text-[11px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest mt-3 underline decoration-purple-500/50 underline-offset-4"
                                >
                                    Launch Your First Mission
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {todayArenas.map(arena => (
                                <ArenaCard key={arena._id} arena={arena} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Past Arenas Section */}
                {pastArenas.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 opacity-50">
                            <div className="h-px flex-1 bg-gradient-to-r from-slate-500/50 to-transparent" />
                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                                <History className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Historical Records</span>
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-l from-slate-500/50 to-transparent" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                            {pastArenas.map(arena => (
                                <ArenaCard key={arena._id} arena={arena} />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Modal */}
            <CreateArenaModal 
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                matchId="" // Empty ID triggers selection mode
                matchName=""
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchArenas();
                }}
            />
        </div>
    );
}
