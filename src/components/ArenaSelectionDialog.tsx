"use client";

import React, { useState, useEffect } from "react";
import { 
    X, 
    Swords, 
    Trophy, 
    Users, 
    Lock, 
    ChevronRight, 
    IndianRupee, 
    ShieldCheck, 
    ArrowRight,
    Search,
    Filter,
    Globe,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";

interface Arena {
    _id: string;
    name: string;
    description: string;
    entryFee: number;
    maxSlots: number;
    slotsCount: number;
    isPrivate: boolean;
    createdBy: { name: string };
    status: string;
    hasJoined?: boolean;
}

interface ArenaSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string;
    matchName: string;
    onJoinSuccess: () => void;
}

export function ArenaSelectionDialog({ 
    isOpen, 
    onClose, 
    matchId, 
    matchName, 
    onJoinSuccess 
}: ArenaSelectionDialogProps) {
    const { showToast } = useToast();
    const [arenas, setArenas] = useState<Arena[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

    useEffect(() => {
        if (isOpen && matchId) {
            fetchArenas();
        }
    }, [isOpen, matchId]);

    const fetchArenas = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/arenas?matchId=${matchId}`);
            const data = await res.json();
            if (res.ok) {
                setArenas(data);
            }
        } catch (error) {
            showToast("Failed to load arenas", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (arenaId: string, inningsNumber: number) => {
        try {
            setJoining(arenaId);
            const res = await fetch("/api/arenas/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ arenaId, inningsNumber })
            });
            const data = await res.json();
            
            if (res.ok) {
                showToast("Joined successfully! Position hidden until T-30.", "success");
                onJoinSuccess();
                onClose();
            } else {
                showToast(data.message || "Failed to join arena", "error");
            }
        } catch (error) {
            showToast("Connection error", "error");
        } finally {
            setJoining(null);
        }
    };

    const filteredArenas = arenas.filter(a => {
        if (filter === 'public') return !a.isPrivate;
        if (filter === 'private') return a.isPrivate;
        return true;
    });

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                {/* Dialog Content */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-[#0A0F1C] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-transparent">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                                    <Swords className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                                    SELECT <span className="text-purple-500">ARENA</span>
                                </h2>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{matchName}</p>
                    </div>

                    {/* Filter Bar */}
                    <div className="px-6 py-4 flex items-center justify-between bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            {['all', 'public', 'private'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f as any)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filter === f 
                                        ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" 
                                        : "bg-white/5 text-slate-400 hover:text-white"
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            {filteredArenas.length} Available
                        </div>
                    </div>

                    {/* Arena List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Spinner />
                                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Active Arenas...</p>
                            </div>
                        ) : filteredArenas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-6">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                                    <Zap className="w-10 h-10 text-slate-700" />
                                </div>
                                <div className="text-center">
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">No Arenas Found</p>
                                    <p className="text-slate-600 text-xs">Be the first to launch a contest for this match!</p>
                                </div>
                            </div>
                        ) : (
                            filteredArenas.map((arena) => (
                                <div 
                                    key={arena._id}
                                    className="group relative bg-slate-900/40 border border-white/5 hover:border-purple-500/50 p-6 rounded-[24px] transition-all duration-300"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">{arena.name}</h3>
                                                {arena.isPrivate ? (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-black text-amber-500 tracking-widest uppercase">
                                                        <Lock className="w-2.5 h-2.5" /> PRIVATE
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 tracking-widest uppercase">
                                                        <Globe className="w-2.5 h-2.5" /> PUBLIC
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="w-4 h-4 text-emerald-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Entry Fee</span>
                                                        <span className="text-sm font-black text-white tracking-tighter italic">₹{arena.entryFee}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-4 h-4 text-blue-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Slots</span>
                                                        <span className="text-sm font-black text-white tracking-tighter italic">{arena.slotsCount}/{arena.maxSlots}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Host</span>
                                                        <span className="text-sm font-black text-white tracking-tighter italic">{arena.createdBy?.name || "System"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* We simplify for now to just joining Innings 1 */}
                                            <button 
                                                onClick={() => !arena.hasJoined && handleJoin(arena._id, 1)}
                                                disabled={joining !== null || arena.slotsCount >= arena.maxSlots || arena.hasJoined}
                                                className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-xs font-black italic uppercase tracking-widest transition-all ${
                                                    arena.hasJoined
                                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 cursor-default"
                                                    : arena.slotsCount >= arena.maxSlots 
                                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20"
                                                }`}
                                            >
                                                {joining === arena._id ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                                ) : arena.hasJoined ? (
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                                        <span>Already Joined</span>
                                                    </div>
                                                ) : arena.slotsCount >= arena.maxSlots ? (
                                                    "Arena Full"
                                                ) : (
                                                    <>Join Now <ArrowRight className="w-4 h-4" /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-6 bg-purple-600/5 border-t border-white/5 flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Zap className="w-5 h-5 text-purple-400" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-relaxed tracking-wider">
                            Positions are hidden until 30 minutes before match start.
                            <span className="text-purple-400"> Our shuffle algorithm ensures 100% fair allocation.</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Utility icon for refresh since I broke the imports in the code block
function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M11 21H6v-5" />
    </svg>
  )
}
