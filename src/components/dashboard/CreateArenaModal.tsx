"use client";

import React, { useState } from "react";
import { 
    X, 
    Swords, 
    IndianRupee, 
    Users, 
    Lock,
    Zap,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/contexts/ToastContext";

interface CreateArenaModalProps {
    isOpen: boolean;
    onClose: () => void;
    matchId: string;
    matchName: string;
    onSuccess: () => void;
}

export function CreateArenaModal({ 
    isOpen, 
    onClose, 
    matchId, 
    matchName, 
    onSuccess 
}: CreateArenaModalProps) {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    
    // Form States
    const [name, setName] = useState("");
    const [entryFee, setEntryFee] = useState<number>(50);
    const [maxSlots, setMaxSlots] = useState<number>(8);

    const slotOptions = [2, 3, 4, 6, 8, 10];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!matchId) return;

        setSubmitting(true);
        try {
            const res = await fetch("/api/arenas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matchId,
                    name: name || `${matchName} Private`,
                    entryFee,
                    maxSlots,
                    isPrivate: true, // Players can only create private arenas
                    description: `User created private contest for ${matchName}`
                })
            });

            if (res.ok) {
                showToast("Arena launched successfully!", "success");
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                showToast(data.message || "Failed to launch arena", "error");
            }
        } catch (err) {
            showToast("Critical error during arena launch", "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
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
                    className="relative w-full max-w-lg bg-[#0A0F1C] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
                >
                    <form onSubmit={handleSubmit}>
                        {/* Header */}
                        <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-r from-amber-900/20 to-transparent">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
                                        <Swords className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                                        HOST <span className="text-amber-500">PRIVATE</span>
                                    </h2>
                                </div>
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{matchName}</p>
                        </div>

                        {/* Form Fields */}
                        <div className="p-8 space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Contest Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={`${matchName} Private`}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-amber-500 transition-all outline-none placeholder:text-slate-700"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* Entry Fee */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Entry Stake (₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                        <input
                                            type="number"
                                            value={entryFee}
                                            onChange={(e) => setEntryFee(Number(e.target.value))}
                                            min={10}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white font-bold focus:border-amber-500 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Slots</label>
                                    <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
                                        {slotOptions.map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setMaxSlots(num)}
                                                className={`flex-1 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${maxSlots === num ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Privacy Notice */}
                            <div className="p-4 bg-amber-500/5 rounded-[20px] border border-amber-500/10 flex items-start gap-4">
                                <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Invite Only</p>
                                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                                        This arena will be <span className="text-white">private</span>. Only users with your unique invite code can join.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="p-8 pt-0">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black uppercase tracking-widest transition-all shadow-2xl shadow-amber-600/30 flex items-center justify-center gap-3 disabled:opacity-50 group"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Auditing System...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Launch Private Arena</span>
                                        <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
