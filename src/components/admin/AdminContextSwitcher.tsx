"use client";

import { useEffect, useState, useRef } from "react";
import { Filter, Check } from "lucide-react";

interface Tournament {
    _id: string;
    name: string;
    isActive: boolean;
}

interface AdminContextSwitcherProps {
    onSelect: (tournamentId: string) => void;
}

export function AdminContextSwitcher({ onSelect }: AdminContextSwitcherProps) {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await fetch("/api/admin/tournaments");
                const data = await res.json();
                if (res.ok) {
                    setTournaments(data);
                    const active = data.find((t: Tournament) => t.isActive);
                    if (active) {
                        setSelectedId(active._id);
                        onSelect(active._id);
                    } else if (data.length > 0) {
                        setSelectedId(data[0]._id);
                        onSelect(data[0]._id);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch tournaments for switch", err);
            }
        };
        fetchTournaments();
    }, []);

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val: string) => {
        setSelectedId(val);
        onSelect(val);
        setIsOpen(false);
    };

    if (tournaments.length === 0) return null;

    const selectedTournament = tournaments.find(t => t._id === selectedId);

    return (
        <div className="relative w-full md:w-auto" ref={dropdownRef}>
            {/* Custom Select Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full md:w-auto gap-3 bg-indigo-500/10 border border-indigo-500/20 hover:border-indigo-400/60 rounded-xl px-4 py-2.5 transition-all group focus:outline-none focus:ring-2 ring-indigo-500/40"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-white text-xs md:text-sm font-bold tracking-wide truncate">
                        {selectedTournament ? `${selectedTournament.name} ${selectedTournament.isActive ? '(Active)' : ''}` : 'Select Tournament'}
                    </span>
                </div>
                {/* Custom dropdown arrow - Animated */}
                <div className={`text-indigo-400/50 group-hover:text-indigo-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </button>

            {/* Custom Dropdown List */}
            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-full min-w-[280px] bg-[#0f172a] border border-indigo-500/30 rounded-xl shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col">
                        {tournaments.map(t => (
                            <button
                                key={t._id}
                                onClick={() => handleSelect(t._id)}
                                className={`w-full flex items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-white/5 border-b border-white/5 last:border-0 ${selectedId === t._id ? 'bg-indigo-500/10' : ''}`}
                            >
                                <span className={`text-sm md:text-xs font-bold tracking-wide truncate ${selectedId === t._id ? 'text-indigo-400' : 'text-slate-300'}`}>
                                    {t.name} {t.isActive ? <span className="opacity-60 text-[9px] ml-1.5 uppercase tracking-widest">(Active)</span> : ''}
                                </span>
                                {selectedId === t._id && <Check className="w-4 h-4 text-indigo-400 shrink-0 ml-2" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>

    );
}
