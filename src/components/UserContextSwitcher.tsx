"use client";

import { useEffect, useState } from "react";
import { Trophy, ChevronDown, Check } from "lucide-react";

interface Tournament {
    _id: string;
    name: string;
    isActive: boolean;
}

export function UserContextSwitcher({ onSelect }: { onSelect: (id: string | null) => void }) {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                // Fetch tournaments using the admin API (or create a public one if preferred)
                // For now, let's assume the admin API is readable by users or we have a public route.
                // Re-using the admin route might fail if not admin, so let's verify.
                const res = await fetch("/api/tournaments"); // We'll need to create this public route
                if (res.ok) {
                    const data: Tournament[] = await res.json();
                    setTournaments(data);
                    
                    if (data.length > 0) {
                        const active = data.find(t => t.isActive) || data[0];
                        setActiveId(active._id);
                        onSelect(active._id);
                    } else {
                        onSelect(null);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch tournaments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, [onSelect]);

    if (loading) {
        return <div className="h-9 w-32 bg-slate-800 animate-pulse rounded-xl"></div>;
    }

    if (tournaments.length === 0) {
        return null;
    }

    const activeTournament = tournaments.find(t => t._id === activeId);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors border border-white/5 shadow-lg max-w-[200px]"
            >
                <Trophy className="w-3.5 h-3.5 text-indigo-400" />
                <span className="truncate">{activeTournament?.name || "Select League"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-white/5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Select League</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1">
                            <button
                                onClick={() => {
                                    setActiveId(null);
                                    onSelect(null);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                                    activeId === null ? 'bg-indigo-500/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className="text-sm font-black truncate pr-2 uppercase italic tracking-tighter">Global Hall of Fame</span>
                                {activeId === null && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                            {tournaments.map((t) => (
                                <button
                                    key={t._id}
                                    onClick={() => {
                                        setActiveId(t._id);
                                        onSelect(t._id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                                        t._id === activeId ? 'bg-indigo-500/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <span className="text-sm font-bold truncate pr-2">{t.name}</span>
                                    {t._id === activeId && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
