"use client";

import React, { useState, useEffect } from "react";
import { 
    X, 
    Swords, 
    IndianRupee, 
    Users, 
    Lock,
    Zap,
    Loader2,
    Calendar,
    Check,
    ChevronDown,
    Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/contexts/ToastContext";
import { useSession } from "next-auth/react";

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
    const [isPrivate, setIsPrivate] = useState(true);
    
    // Match Selection States
    const [selectedMatchId, setSelectedMatchId] = useState(matchId || "");
    const [availableMatches, setAvailableMatches] = useState<any[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [matchSelectorOpen, setMatchSelectorOpen] = useState(false);

    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || 'user';
    const isAdmin = userRole === 'admin' || userRole === 'subadmin';

    // Fetch Today's Matches if no ID passed or if selector needed
    useEffect(() => {
        if (isOpen && !matchId) {
            fetchTodayMatches();
        }
    }, [isOpen, matchId]);

    const fetchTodayMatches = async () => {
        setLoadingMatches(true);
        try {
            const res = await fetch("/api/matches?today=true");
            if (res.ok) {
                const data = await res.json();
                setAvailableMatches(data);
            }
        } catch (err) {
            console.error("Failed to fetch today matches", err);
        } finally {
            setLoadingMatches(false);
        }
    };

    const selectedMatch = matchId 
        ? { _id: matchId, teams: [{ name: matchName.split(' vs ')[0] }, { name: matchName.split(' vs ')[1] }] }
        : availableMatches.find(m => m._id === selectedMatchId);

    const activeMatchName = matchId ? matchName : (selectedMatch ? `${selectedMatch.teams[0].shortName || selectedMatch.teams[0].name} vs ${selectedMatch.teams[1].shortName || selectedMatch.teams[1].name}` : "Select Today's Match");

    const themes = {
        admin: {
            accent: 'indigo',
            primary: 'bg-indigo-600',
            hover: 'hover:bg-indigo-500',
            text: 'text-indigo-500',
            border: 'focus:border-indigo-500',
            shadow: 'shadow-indigo-600/30',
            gradient: 'from-indigo-900/20'
        },
        subadmin: {
            accent: 'purple',
            primary: 'bg-purple-600',
            hover: 'hover:bg-purple-500',
            text: 'text-purple-500',
            border: 'focus:border-purple-500',
            shadow: 'shadow-purple-600/30',
            gradient: 'from-purple-900/20'
        },
        user: {
            accent: 'amber',
            primary: 'bg-amber-600',
            hover: 'hover:bg-amber-500',
            text: 'text-amber-500',
            border: 'focus:border-amber-500',
            shadow: 'shadow-amber-600/30',
            gradient: 'from-amber-900/20'
        }
    };

    const theme = themes[userRole as keyof typeof themes] || themes.user;
    const slotOptions = [2, 3, 4, 6, 8, 10];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMatchId) {
            showToast("Please select a match first", "error");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/arenas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    matchId: selectedMatchId,
                    name: name || `${activeMatchName} Private`,
                    entryFee,
                    maxSlots,
                    isPrivate: isAdmin ? isPrivate : true,
                    description: `${userRole.toUpperCase()} created contest for ${matchName}`
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
                        <div className={`p-6 md:p-8 border-b border-white/5 bg-gradient-to-r ${theme.gradient} to-transparent`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 ${theme.primary} rounded-xl flex items-center justify-center`}>
                                        <Swords className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-xl font-black text-white italic uppercase tracking-tight">
                                        HOST <span className={theme.text}>{userRole === 'user' ? 'PRIVATE' : 'ARENA'}</span>
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
                            
                            {!matchId ? (
                                <div className="relative mt-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-2 block">Available Today</label>
                                    <button
                                        type="button"
                                        onClick={() => setMatchSelectorOpen(!matchSelectorOpen)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between group hover:border-indigo-500/50 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-indigo-400" />
                                            <span className={`text-sm font-bold ${selectedMatchId ? 'text-white' : 'text-slate-500'}`}>
                                                {activeMatchName}
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${matchSelectorOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {matchSelectorOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute z-[1200] left-0 right-0 mt-2 bg-[#0A0F1C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
                                            >
                                                {loadingMatches ? (
                                                    <div className="p-4 flex items-center justify-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning Waves...</span>
                                                    </div>
                                                ) : availableMatches.length === 0 ? (
                                                    <div className="p-4 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">No Matches Today</div>
                                                ) : availableMatches.map(m => (
                                                    <button
                                                        key={m._id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedMatchId(m._id);
                                                            setMatchSelectorOpen(false);
                                                        }}
                                                        className={`w-full p-4 flex items-center justify-between group hover:bg-white/5 transition-all ${selectedMatchId === m._id ? 'bg-indigo-500/10' : ''}`}
                                                    >
                                                        <div className="flex flex-col items-start gap-1">
                                                            <div className="text-xs font-black text-white italic uppercase tracking-tight">
                                                                {m.teams[0].shortName || m.teams[0].name} vs {m.teams[1].shortName || m.teams[1].name}
                                                            </div>
                                                            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                                                {m.seriesName || m.matchDesc} • {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                        {selectedMatchId === m._id && <Check className="w-4 h-4 text-indigo-400" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{activeMatchName}</p>
                            )}
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
                                    placeholder={`${activeMatchName} ${userRole === 'user' ? 'Private' : 'Official'}`}
                                    className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold ${theme.border} transition-all outline-none placeholder:text-slate-700`}
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
                                            className={`w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white font-bold ${theme.border} transition-all outline-none`}
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
                                                className={`flex-1 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-all ${maxSlots === num ? `${theme.primary} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Privacy Toggle (Only for Admin/Sub) */}
                            {isAdmin ? (
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${isPrivate ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'}`}>
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
                                        className={`w-12 h-6 rounded-full relative transition-colors ${isPrivate ? 'bg-purple-600' : theme.primary}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            ) : (
                                /* Privacy Notice for Players */
                                <div className="p-4 bg-amber-500/5 rounded-[20px] border border-amber-500/10 flex items-start gap-4">
                                    <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Invite Only</p>
                                        <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                                            This arena will be <span className="text-white">private</span>. Only users with your unique invite code can join.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="p-8 pt-0">
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`w-full py-5 rounded-2xl ${theme.primary} ${theme.hover} text-white font-black uppercase tracking-widest transition-all shadow-2xl ${theme.shadow} flex items-center justify-center gap-3 disabled:opacity-50 group`}
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
