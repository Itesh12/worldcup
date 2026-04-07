"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { 
    Swords, 
    Plus, 
    Search, 
    Filter, 
    RefreshCw, 
    Trophy, 
    Users, 
    ChevronRight,
    Zap,
    ShieldCheck,
    Building2,
    Calendar,
    ChevronDown,
    ChevronUp,
    ArrowLeft
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { Spinner } from "@/components/ui/Spinner";
import { CreateArenaModal } from "@/components/dashboard/CreateArenaModal";
import { ArenaDetailView } from "@/components/dashboard/ArenaDetailView";
import { DollarSign, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface Arena {
    _id: string;
    name: string;
    entryFee: number;
    maxSlots: number;
    slotsCount: number;
    isPrivate: boolean;
    status: string;
    adminCommissionPercentage?: number;
    organizerCommissionPercentage?: number;
    createdBy: {
        _id: string;
        name: string;
        email: string;
        role: string;
    };
    matchId: {
        _id: string;
        teams: Array<{ name: string; shortName: string; image?: string }>;
        seriesName: string;
        startTime: string;
        status: string;
    };
    createdAt: string;
}

function ArenasContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";
    const { showToast } = useToast();
    
    const [arenas, setArenas] = useState<Arena[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedArenaForView, setSelectedArenaForView] = useState<{ arenaId: string; matchId: string } | null>(null);
    const [settling, setSettling] = useState<string | null>(null);
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "subadmin">("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "upcoming" | "live" | "completed">("all");
    const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});

    const fetchArenas = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/arenas");
            if (res.ok) {
                const data = await res.json();
                setArenas(data);
                
                // Expand first 3 matches by default
                const initialExpanded: Record<string, boolean> = {};
                const matchIds = Array.from(new Set(data.map((a: any) => a.matchId?._id))).slice(0, 3);
                matchIds.forEach(id => { if(id) initialExpanded[id as string] = true; });
                setExpandedMatches(initialExpanded);
            }
        } catch (err) {
            showToast("Failed to sync global arena grid", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            if ((session?.user as any)?.role !== "admin") {
                router.push("/dashboard");
            } else {
                fetchArenas();
            }
        }
    }, [status, session]);

    // Grouping & Filtering
    const matchGroups = useMemo(() => {
        let filtered = arenas.filter(arena => {
            if (!arena.matchId) return false;
            
            const matchSearch = (arena.matchId.teams[0].name + arena.matchId.teams[1].name + arena.matchId.seriesName).toLowerCase();
            const matchesSearch = matchSearch.includes(searchQuery.toLowerCase());
            
            const matchesRole = roleFilter === "all" || arena.createdBy.role === roleFilter;
            const matchesStatus = statusFilter === "all" || arena.matchId.status === statusFilter;
            
            return matchesSearch && matchesRole && matchesStatus;
        });

        const groups: Record<string, { match: any, arenas: Arena[] }> = {};
        
        filtered.forEach(arena => {
            const mId = arena.matchId._id;
            if (!groups[mId]) {
                groups[mId] = { match: arena.matchId, arenas: [] };
            }
            groups[mId].arenas.push(arena);
        });

        // Sort arenas within groups: Admin First, then by Entry Fee
        Object.values(groups).forEach(group => {
            group.arenas.sort((a, b) => {
                if (a.createdBy.role === 'admin' && b.createdBy.role !== 'admin') return -1;
                if (a.createdBy.role !== 'admin' && b.createdBy.role === 'admin') return 1;
                return b.entryFee - a.entryFee;
            });
        });

        return Object.values(groups).sort((a, b) => new Date(a.match.startTime).getTime() - new Date(b.match.startTime).getTime());
    }, [arenas, searchQuery, roleFilter, statusFilter]);

    const toggleMatch = (mId: string) => {
        setExpandedMatches(prev => ({ ...prev, [mId]: !prev[mId] }));
    };

    if (loading && arenas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing High-Density Grid...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 space-y-8 max-w-[1600px] mx-auto pb-24 lg:pb-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Link 
                        href={isPlayerView ? "/dashboard?view=player" : "/admin"}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center border border-indigo-400/30 shadow-lg shadow-indigo-600/20">
                            <Swords className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                                GLOBAL <span className="text-indigo-500">ARENAS</span>
                            </h1>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Cross-Platform Unit Management</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                            type="text"
                            placeholder="SEARCH TEAMS OR SERIES..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-900 border border-white/5 rounded-2xl pl-11 pr-6 py-3.5 text-[10px] font-black text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all w-64 uppercase tracking-widest"
                        />
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                        Deploy Official Arena
                    </button>
                    <button 
                        onClick={fetchArenas}
                        className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl text-slate-500 hover:text-white hover:border-white/10 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Filter Matrix:</span>
                </div>
                
                <div className="flex items-center gap-2">
                    {['all', 'admin', 'subadmin'].map(f => (
                        <button
                            key={f}
                            onClick={() => setRoleFilter(f as any)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                roleFilter === f 
                                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' 
                                : 'bg-white/5 border-transparent text-slate-500 hover:text-white'
                            }`}
                        >
                            {f === 'admin' ? 'Official' : f === 'subadmin' ? 'Franchise' : 'All Agencies'}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-white/5" />

                <div className="flex items-center gap-2">
                    {['all', 'upcoming', 'live', 'completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f as any)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                statusFilter === f 
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                                : 'bg-white/5 border-transparent text-slate-500 hover:text-white'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Arena Grid */}
            <div className="space-y-6">
                {matchGroups.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center rounded-[40px] border border-dashed border-white/10 bg-white/[0.01] gap-6">
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-600 uppercase tracking-[0.3em]">No units matching criteria</p>
                        </div>
                    </div>
                ) : (
                    matchGroups.map((group) => (
                        <div key={group.match._id} className="space-y-4">
                            {/* Match Header Card */}
                            <div 
                                onClick={() => toggleMatch(group.match._id)}
                                className="group cursor-pointer bg-[#0A0F1C] border border-white/5 rounded-3xl p-5 hover:border-indigo-500/30 transition-all duration-500"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center -space-x-4">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-white/5 flex items-center justify-center overflow-hidden z-10 shadow-xl group-hover:border-indigo-500/50 transition-colors">
                                                <span className="text-xl font-black text-white italic">{group.match.teams[0].shortName}</span>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center z-20 shadow-lg border-2 border-[#0A0F1C]">
                                                <Zap className="w-5 h-5 text-white animate-pulse" />
                                            </div>
                                            <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-white/5 flex items-center justify-center overflow-hidden z-10 shadow-xl group-hover:border-indigo-500/50 transition-colors">
                                                <span className="text-xl font-black text-white italic">{group.match.teams[1].shortName}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none mb-1">
                                                {group.match.teams[0].name} <span className="text-indigo-500">VS</span> {group.match.teams[1].name}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{group.match.seriesName}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-700" />
                                                <span className="flex items-center gap-1.5 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(group.match.startTime).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="text-center border-x border-white/5 px-8">
                                            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Active Arenas</span>
                                            <span className="text-2xl font-black text-white tracking-tighter">{group.arenas.length}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {expandedMatches[group.match._id] ? (
                                                <ChevronUp className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                            ) : (
                                                <ChevronDown className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Arenas List */}
                            <AnimatePresence>
                                {expandedMatches[group.match._id] && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2 pb-4">
                                            {group.arenas.map((arena) => (
                                                <div 
                                                    key={arena._id}
                                                    onClick={() => setSelectedArenaForView({ arenaId: arena._id, matchId: arena.matchId._id })}
                                                    className={`relative bg-slate-900/50 border rounded-3xl p-5 hover:scale-[1.02] transition-all duration-300 cursor-pointer ${
                                                        arena.createdBy.role === 'admin' 
                                                        ? 'border-indigo-500/20 hover:border-indigo-500/50' 
                                                        : 'border-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4 mb-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1.5 font-black uppercase tracking-widest">
                                                                {arena.createdBy.role === 'admin' ? (
                                                                    <span className="flex items-center gap-1 text-[7px] text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded border border-indigo-400/20">
                                                                        <ShieldCheck className="w-2.5 h-2.5" /> PLATFORM OFFICIAL
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1 text-[7px] text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded border border-purple-400/20">
                                                                        <Building2 className="w-2.5 h-2.5" /> FRANCHISE UNIT
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="text-sm font-black text-white italic uppercase truncate">{arena.name}</h4>
                                                        </div>
                                                        <div className={`p-2.5 rounded-xl ${arena.createdBy.role === 'admin' ? 'bg-indigo-600/10 text-indigo-400' : 'bg-purple-600/10 text-purple-400'}`}>
                                                            <Swords className="w-4 h-4" />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
                                                            <span className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Stake</span>
                                                            <span className="block text-xs font-black text-white">₹{arena.entryFee}</span>
                                                        </div>
                                                        <div className="bg-white/[0.02] rounded-xl p-2.5 border border-white/5">
                                                            <span className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Fill</span>
                                                            <span className="block text-xs font-black text-white">{arena.slotsCount}/{arena.maxSlots}</span>
                                                        </div>
                                                    </div>

                                                    {/* Operational Financials & Settlement */}
                                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                                        <div className="bg-indigo-500/5 rounded-xl p-2.5 border border-indigo-500/10">
                                                            <span className="block text-[8px] font-black text-indigo-500/60 uppercase mb-0.5 tracking-tight">Platform Profit</span>
                                                            <span className="block text-xs font-black text-indigo-400 italic">
                                                                ₹{((arena.slotsCount * arena.entryFee) * (arena.adminCommissionPercentage || 0) / 100).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="bg-purple-500/5 rounded-xl p-2.5 border border-purple-500/10">
                                                            <span className="block text-[8px] font-black text-purple-500/60 uppercase mb-0.5 tracking-tight">Org Comm.</span>
                                                            <span className="block text-xs font-black text-purple-400 italic">
                                                                ₹{((arena.slotsCount * arena.entryFee) * (arena.organizerCommissionPercentage || 0) / 100).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {['finished', 'completed', 'result', 'settled'].includes(arena.matchId.status) && arena.status !== 'completed' && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (settling) return;
                                                                try {
                                                                    setSettling(arena._id);
                                                                    const res = await fetch(`/api/admin/arenas/${arena._id}/settle`, { method: 'POST' });
                                                                    if (res.ok) {
                                                                        showToast("Arena Settled Successfully", "success");
                                                                        fetchArenas();
                                                                    } else {
                                                                        const data = await res.json();
                                                                        showToast(data.message || "Settlement Failed", "error");
                                                                        fetchArenas();
                                                                    }
                                                                } catch (err) {
                                                                    showToast("Network Error", "error");
                                                                } finally {
                                                                    setSettling(null);
                                                                }
                                                            }}
                                                            className="w-full mb-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                                        >
                                                            {settling === arena._id ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    Quick Settle Prize Pool
                                                                </>
                                                            )}
                                                        </button>
                                                    )}

                                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                        <div className="min-w-0">
                                                            <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5 italic">By {arena.createdBy.name}</span>
                                                            <span className="block text-[7px] font-bold text-slate-500 truncate">{arena.createdBy.email}</span>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedArenaForView({ arenaId: arena._id, matchId: arena.matchId._id });
                                                            }}
                                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group/link"
                                                        >
                                                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover/link:text-white" />
                                                        </button>
                                                    </div>
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
                    showToast("Arena Grid Updated", "success");
                }}
            />

            {/* Arena Detail Inspection Modal */}
            <ArenaDetailView 
                isOpen={!!selectedArenaForView}
                onClose={() => setSelectedArenaForView(null)}
                arenaId={selectedArenaForView?.arenaId || ""}
                matchId={selectedArenaForView?.matchId || ""}
            />
        </div>
    );
}

export default function AdminArenasPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing High-Density Grid...</p>
            </div>
        }>
            <ArenasContent />
        </Suspense>
    );
}
