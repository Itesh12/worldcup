"use client";

import React, { useState, useEffect } from "react";
import {
    Swords,
    Plus,
    Users,
    Lock,
    Globe,
    ShieldCheck,
    Zap,
    X,
    Trophy,
    Activity,
    Trash2,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useToast } from "@/contexts/ToastContext";
import { CreateArenaModal } from "@/components/dashboard/CreateArenaModal";

interface Arena {
    _id: string;
    name: string;
    entryFee: number;
    maxSlots: number;
    slotsCount: number;
    isPrivate: boolean;
    inviteCode?: string;
    status: string;
    createdBy: { name: string; _id: string };
}

interface ArenaManagerProps {
    matchId: string;
    matchName: string;
    userRole: 'admin' | 'subadmin' | 'user';
    onClose: () => void;
}

export default function ArenaManager({ matchId, matchName, userRole, onClose }: ArenaManagerProps) {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const currentUser = session?.user as any;
    const [arenas, setArenas] = useState<Arena[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchArenas();
    }, [matchId]);

    const fetchArenas = async () => {
        try {
            const res = await fetch(`/api/arenas?matchId=${matchId}`);
            const data = await res.json();
            if (res.ok) setArenas(data);
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch arenas.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (arenaId: string) => {
        if (!confirm("Are you sure you want to cancel this arena? All joined users will be refunded.")) return;

        setDeletingId(arenaId);
        try {
            const res = await fetch(`/api/arenas/${arenaId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                showToast("Arena cancelled and refunds processed.", "success");
                fetchArenas();
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to cancel arena", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("An error occurred while cancelling the arena", "error");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative w-full max-w-2xl h-full bg-[#050B14] border-l border-white/5 shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Swords className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                                {userRole === 'admin' ? 'Match Logistics' : userRole === 'subadmin' ? 'Network Hub' : 'Host Contest'}
                            </h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{matchName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 text-slate-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em]">Active Arenas</h3>
                            <button
                                onClick={() => setShowCreate(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                            >
                                <Plus className="w-4 h-4" /> Initialize Arena
                            </button>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
                                ))}
                            </div>
                        ) : arenas.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2.5rem]">
                                <Activity className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-50" />
                                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">No Active Contests for this Match</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {arenas.map((arena) => (
                                    <div key={arena._id} className="group relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${arena.isPrivate ? 'bg-purple-500/10 text-purple-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                                    {arena.isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white uppercase tracking-tighter truncate max-w-[200px]">{arena.name}</h4>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Created by {arena.createdBy?.name || 'Platform'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black text-white tracking-tighter">₹{arena.entryFee.toLocaleString()}</div>
                                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Entry Fee</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Occupation</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-indigo-500 transition-all duration-1000"
                                                                style={{ width: `${(arena.slotsCount / arena.maxSlots) * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-[10px] font-black text-white">{arena.slotsCount}/{arena.maxSlots}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {arena.inviteCode && (
                                                    <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black text-indigo-400 font-mono tracking-widest">
                                                        {arena.inviteCode}
                                                    </div>
                                                )}
                                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${arena.status === 'open' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {arena.status}
                                                </div>

                                                {(userRole === 'admin' || (currentUser?.id === arena.createdBy?._id)) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(arena._id);
                                                        }}
                                                        disabled={deletingId === arena._id}
                                                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                                        title="Cancel Arena"
                                                    >
                                                        {deletingId === arena._id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <CreateArenaModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                matchId={matchId}
                matchName={matchName}
                onSuccess={() => {
                    setShowCreate(false);
                    fetchArenas();
                }}
            />
        </div>
    );
}
