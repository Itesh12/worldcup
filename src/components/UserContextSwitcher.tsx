"use client";

import { useEffect, useState } from "react";
import { Trophy, ChevronDown, Check } from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";

interface Tournament {
    _id: string;
    name: string;
    isActive: boolean;
}

export function UserContextSwitcher({ onSelect }: { onSelect?: (id: string | null) => void }) {
    const { tournamentId, setTournamentId } = useTournament();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch("/api/tournaments");
                if (res.ok) {
                    const data: Tournament[] = await res.json();
                    setTournaments(data);
                    
                    // If no tournament is selected yet, pick the active one or the first one
                    if (!tournamentId && data.length > 0) {
                        const active = data.find(t => t.isActive) || data[0];
                        setTournamentId(active._id);
                        if (onSelect) onSelect(active._id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch tournaments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, [tournamentId, setTournamentId, onSelect]);

    if (loading) {
        return <div className="h-9 w-32 bg-slate-800 animate-pulse rounded-xl"></div>;
    }

    if (tournaments.length === 0) {
        return null;
    }

    const activeTournament = tournaments.find(t => t._id === tournamentId);

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 md:px-5 py-3.5 bg-slate-800/40 hover:bg-slate-700/60 text-white text-[10px] md:text-sm font-black rounded-2xl transition-all border border-white/10 shadow-2xl backdrop-blur-sm group"
            >
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="p-1 md:p-1.5 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors shrink-0">
                        <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-400" />
                    </div>
                    <span className="truncate tracking-tight uppercase italic leading-none">{activeTournament?.name || "Select League"}</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Select League</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                            {tournaments.map((t) => (
                                <button
                                    key={t._id}
                                    onClick={() => {
                                        setTournamentId(t._id);
                                        if (onSelect) onSelect(t._id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                                        t._id === tournamentId ? 'bg-indigo-500/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <span className="text-sm font-bold truncate pr-2">{t.name}</span>
                                    {t._id === tournamentId && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
