"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

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

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedId(val);
        onSelect(val);
    };

    if (tournaments.length === 0) return null;

    return (
        <div className="flex items-center gap-2 bg-slate-900/50 border border-white/10 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 transition-colors">
            <Filter className="w-4 h-4 text-indigo-400" />
            <select 
                value={selectedId}
                onChange={handleChange}
                className="bg-transparent text-white text-xs font-bold focus:outline-none appearance-none cursor-pointer pr-4"
            >
                {tournaments.map(t => (
                    <option key={t._id} value={t._id} className="bg-slate-900 text-white">
                        {t.name} {t.isActive ? '(Active Sync)' : ''}
                    </option>
                ))}
            </select>
        </div>
    );
}
