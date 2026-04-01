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
    Check,
    ChevronRight,
    Trophy,
    DollarSign,
    Share2,
    Calendar,
    Activity,
    AlertCircle,
    Trash2,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useToast } from "@/contexts/ToastContext";

interface Arena {
    _id: string;
    name: string;
    entryFee: number;
    maxSlots: number;
    slotsCount: number;
    isPrivate: boolean;
    inviteCode?: string;
    status: string;
    adminCommissionPercentage: number;
    organizerCommissionPercentage: number;
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
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [entryFee, setEntryFee] = useState<number>(50);
    const [maxSlots, setMaxSlots] = useState<number>(8);
    const [isPrivate, setIsPrivate] = useState(userRole === 'user');

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/arenas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matchId,
                    name: name || (userRole === 'user' ? `${matchName} Private` : `${matchName} Official`),
                    entryFee,
                    maxSlots,
                    isPrivate: userRole === 'user' ? true : isPrivate,
                    description: `${userRole.toUpperCase()} created contest for ${matchName}`
                })
            });
            if (res.ok) {
                showToast("Arena launched successfully!", "success");
                setShowCreate(false);
                setName("");
                fetchArenas();
            } else {
                const error = await res.json();
                showToast(error.message || "Failed to launch arena", "error");
            }
        } catch (err) {
            console.error(err);
            showToast("Critical error during arena launch", "error");
        } finally {
            setSubmitting(false);
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

    const slotOptions = [2, 3, 4, 6, 8, 10]; // As requested: odd/even mix up to 10

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
                    <AnimatePresence mode="wait">
                        {!showCreate ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
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

                                                        {(userRole === 'admin' || (currentUser?.id === arena.createdBy._id)) && (
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
                            </motion.div>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleCreate}
                                className="space-y-8"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Initialize <span className="text-indigo-400">New Arena</span></h3>
                                </div>

                                <div className="space-y-6">
                                    {/* Arena Identity */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Arena Identity (Name)</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={userRole === 'user' ? "E.g. My Private Circle" : "E.g. Elite Mega Contest"}
                                            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-indigo-500 transition-all outline-none placeholder:text-slate-800"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Entry Fee */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Entry Stake (₹)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                                <input
                                                    type="number"
                                                    value={entryFee}
                                                    onChange={(e) => setEntryFee(Number(e.target.value))}
                                                    className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white font-bold focus:border-indigo-500 transition-all outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Slot Limit */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Slot Density</label>
                                            <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-white/10 rounded-2xl overflow-x-auto no-scrollbar">
                                                {slotOptions.map(num => (
                                                    <button
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setMaxSlots(num)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all shrink-0 ${maxSlots === num ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
                                                    >
                                                        {num}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Privacy Toggle (Only for Admin/Sub) */}
                                    {userRole !== 'user' && (
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${isPrivate ? 'bg-purple-500/10 text-purple-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                                    {isPrivate ? <Lock className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-white uppercase tracking-tighter text-sm">{isPrivate ? 'Private Network' : 'Global Public'}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isPrivate ? 'Requires Invite Code' : 'Visible to All Players'}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsPrivate(!isPrivate)}
                                                className={`w-12 h-6 rounded-full relative transition-colors ${isPrivate ? 'bg-purple-600' : 'bg-slate-800'}`}
                                            >
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Economics Info */}
                                    <div className="p-6 bg-indigo-500/5 rounded-3xl border border-indigo-500/10 flex items-start gap-4">
                                        <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Economics Forecast</p>
                                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                                                {userRole === 'user'
                                                    ? `As a Private Host, you will receive a 2% incentive (₹${(entryFee * maxSlots * 0.02).toFixed(1)}) from the total pool if all slots are filled.`
                                                    : `This arena will yield a platform commission based on the match-level percentage configurations.`}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {submitting ? 'Auditing System...' : 'Launch Arena'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
