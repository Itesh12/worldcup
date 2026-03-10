"use strict";
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle, Plus, Trophy, Activity, Globe, Search, RefreshCw, ChevronDown } from "lucide-react";

interface Tournament {
    _id: string;
    name: string;
    cricbuzzSeriesId: string;
    cricbuzzSlug: string;
    isActive: boolean;
    commissionPercentage: number;
    entryFee: number;
}

export default function AdminTournamentsPage() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    
    // Form state
    const [name, setName] = useState("");
    const [seriesId, setSeriesId] = useState("");
    const [slug, setSlug] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [commissionPercentage, setCommissionPercentage] = useState(5);
    const [entryFee, setEntryFee] = useState(50);
    
    // Cricbuzz series fetching
    const [availableSeries, setAvailableSeries] = useState<{id: string, name: string, slug: string}[]>([]);
    const [fetchingSeries, setFetchingSeries] = useState(false);
    const [selectedSeriesId, setSelectedSeriesId] = useState("");

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await fetch("/api/admin/tournaments");
            const data = await res.json();
            if (res.ok) setTournaments(data);
        } catch (err) {
            console.error("Failed to fetch tournaments", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCricbuzzSeries = async () => {
        setFetchingSeries(true);
        try {
            const res = await fetch("/api/admin/tournaments/cricbuzz-series");
            const data = await res.json();
            if (res.ok) setAvailableSeries(data);
        } catch (err) {
            console.error("Failed to fetch Cricbuzz series", err);
        } finally {
            setFetchingSeries(false);
        }
    };

    useEffect(() => {
        if (showNewForm && availableSeries.length === 0) {
            fetchCricbuzzSeries();
        }
    }, [showNewForm]);

    const handleSeriesSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedSeriesId(id);
        const series = availableSeries.find(s => s.id === id);
        if (series) {
            setName(series.name);
            setSeriesId(series.id);
            setSlug(series.slug);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/tournaments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    name, 
                    cricbuzzSeriesId: seriesId, 
                    cricbuzzSlug: slug, 
                    isActive,
                    commissionPercentage,
                    entryFee
                })
            });
            if (res.ok) {
                setShowNewForm(false);
                setName("");
                setSeriesId("");
                setSlug("");
                setIsActive(false);
                setCommissionPercentage(5);
                setEntryFee(50);
                await fetchTournaments();
            }
        } catch (err) {
            console.error("Failed to create tournament", err);
        }
    };

    const handleMigrate = async () => {
        if (!confirm("Are you sure you want to run the migration to link existing data to the default World Cup tournament?")) return;
        setIsMigrating(true);
        try {
            const res = await fetch("/api/admin/migrate", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                alert("Migration successful: " + JSON.stringify(data.results));
                await fetchTournaments();
            } else {
                alert("Migration failed: " + data.message);
            }
        } catch (err) {
            console.error("Migration error", err);
            alert("Migration failed");
        } finally {
            setIsMigrating(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        // Option to toggle it to true. If it's already true, maybe user shouldn't toggle to false offhand, 
        // they should toggle another to true.
        try {
            const res = await fetch("/api/admin/tournaments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: true }) // Setting one active deactivates others
            });
            if (res.ok) {
                await fetchTournaments();
            }
        } catch (err) {
            console.error("Failed to toggle tournament", err);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-20">
            <header className="sticky top-0 z-[60] bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between font-sans">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                        <h1 className="text-lg md:text-xl font-black text-white tracking-tight uppercase">Leagues <span className="text-indigo-500">& Tournaments</span></h1>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
                <div className="flex justify-between items-center mb-8">
                    <p className="text-slate-400 font-medium text-sm md:text-base italic">Manage data contexts like World Cup or IPL.</p>
                    <div className="flex gap-2">
                        <button 
                            onClick={handleMigrate}
                            disabled={isMigrating}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700 disabled:opacity-50"
                        >
                            {isMigrating ? "Migrating..." : "Run Migration"}
                        </button>
                        <button 
                            onClick={() => setShowNewForm(!showNewForm)}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Plus className="w-4 h-4" /> Add Tournament
                        </button>
                    </div>
                </div>

                {showNewForm && (
                     <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 mb-8 backdrop-blur-xl shadow-xl">
                        <h2 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">New Tournament Details</h2>
                        
                        <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl relative">
                            <label className="block text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">Quick Select from Cricbuzz</label>
                            <div className="relative">
                                <select 
                                    value={selectedSeriesId}
                                    onChange={handleSeriesSelect}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-all font-medium text-sm appearance-none cursor-pointer"
                                >
                                    <option value="" className="bg-slate-900">-- Choose an ongoing series --</option>
                                    {availableSeries.map(s => (
                                        <option key={s.id} value={s.id} className="bg-slate-900">{s.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-2">
                                    {fetchingSeries ? (
                                        <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    )}
                                </div>
                            </div>
                            <p className="mt-2 text-[10px] text-slate-500 italic">Select a series to auto-fill the details below. You can still edit them manually.</p>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Display Name</label>
                                    <input 
                                        type="text" required
                                        value={name} onChange={e => setName(e.target.value)}
                                        placeholder="e.g. IPL 2025"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Cricbuzz Series ID</label>
                                    <input 
                                        type="text" required
                                        value={seriesId} onChange={e => setSeriesId(e.target.value)}
                                        placeholder="e.g. 12345"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide">Cricbuzz Slug</label>
                                    <input 
                                        type="text" required
                                        value={slug} onChange={e => setSlug(e.target.value)}
                                        placeholder="e.g. indian-premier-league-2025"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-600' : 'bg-white/10 group-hover:bg-white/20'}`}>
                                            {isActive && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                                        <span className="text-slate-300 font-bold text-sm select-none">Set as Active Sync</span>
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide text-indigo-400">Entry Fee (INR)</label>
                                    <input 
                                        type="number" required
                                        value={entryFee} onChange={e => setEntryFee(Number(e.target.value))}
                                        placeholder="50"
                                        className="w-full bg-black/40 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide text-indigo-400">Admin Commission (%)</label>
                                    <input 
                                        type="number" required
                                        value={commissionPercentage} onChange={e => setCommissionPercentage(Number(e.target.value))}
                                        placeholder="5"
                                        className="w-full bg-black/40 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all w-full md:w-auto">
                                    Save Tournament
                                </button>
                                <button type="button" onClick={() => setShowNewForm(false)} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all w-full md:w-auto border border-white/10">
                                    Cancel
                                </button>
                            </div>
                        </form>
                     </div>
                )}

                {loading ? (
                    <div className="h-40 bg-slate-900/40 border border-white/5 rounded-2xl animate-pulse" />
                ) : tournaments.length === 0 ? (
                    <div className="text-center py-20 bg-slate-950/40 border border-dashed border-white/10 rounded-3xl">
                        <Globe className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-50" />
                        <p className="text-slate-400 font-medium">No tournaments found. Migrate or Add one.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tournaments.map((t) => (
                            <div key={t._id} className={`relative overflow-hidden bg-slate-950/40 border rounded-3xl p-6 transition-all duration-300 shadow-xl ${t.isActive ? 'border-indigo-500/50 shadow-indigo-500/10' : 'border-white/5 hover:border-white/10'}`}>
                                {t.isActive && <div className="absolute inset-0 bg-indigo-500/5 pointer-events-none" />}
                                
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase mb-1">{t.name}</h3>
                                        <div className="flex gap-3 text-xs font-bold font-mono">
                                            <span className="text-slate-500">ID: {t.cricbuzzSeriesId}</span>
                                        </div>
                                    </div>
                                    {t.isActive ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                                            <Activity className="w-3 h-3 animate-pulse" /> Active
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => handleToggleActive(t._id, t.isActive)}
                                            className="group flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 rounded-full text-xs font-bold text-slate-300 hover:text-white transition-all"
                                        >
                                            <Circle className="w-3.5 h-3.5 group-hover:hidden" />
                                            <CheckCircle className="w-3.5 h-3.5 hidden group-hover:block" />
                                            Set Active
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs text-slate-400">
                                        <span className="font-bold text-slate-500 uppercase tracking-wide mr-2 text-[10px]">Slug:</span> 
                                        {t.cricbuzzSlug}
                                    </div>
                                    <div className="flex gap-4 pt-2 border-t border-white/5 mt-2">
                                        <div className="text-xs text-slate-400">
                                            <span className="font-bold text-slate-500 uppercase tracking-wide mr-2 text-[10px]">Entry Fee:</span> 
                                            <span className="text-indigo-400">₹{t.entryFee}</span>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            <span className="font-bold text-slate-500 uppercase tracking-wide mr-2 text-[10px]">Commission:</span> 
                                            <span className="text-indigo-400">{t.commissionPercentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
