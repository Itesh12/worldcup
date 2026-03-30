"use strict";
"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle, Plus, Trophy, Activity, Globe, Search, RefreshCw, ChevronDown, AlertTriangle } from "lucide-react";

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
    const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
    
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
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

    const handleSeriesSelect = (id: string) => {
        setSelectedSeriesId(id);
        setIsDropdownOpen(false);
        const series = availableSeries.find(s => s.id === id);
        if (series) {
            setName(series.name);
            setSeriesId(series.id);
            setSlug(series.slug);
        } else {
            setName("");
            setSeriesId("");
            setSlug("");
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

    const handleMigrateClick = () => {
        setShowMigrateConfirm(true);
    };

    const executeMigration = async () => {
        setShowMigrateConfirm(false);
        setIsMigrating(true);
        try {
            const res = await fetch("/api/admin/migrate", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                setMigrationStatus({ type: 'success', message: "Data migration completed successfully. Unlinked matches have been bound to the default tournament. Results: " + JSON.stringify(data.results) });
                await fetchTournaments();
            } else {
                setMigrationStatus({ type: 'error', message: "Migration failed: " + data.message });
            }
        } catch (err) {
            console.error("Migration error", err);
            setMigrationStatus({ type: 'error', message: "A critical error occurred while attempting to migrate data." });
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
            {/* --- CUSTOM MODALS --- */}
            {showMigrateConfirm && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-amber-500/30 rounded-[32px] p-6 max-w-sm w-full shadow-[0_0_50px_rgba(245,158,11,0.1)] animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 mx-auto border border-amber-500/20">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="text-xl font-black text-white text-center mb-3 uppercase tracking-wide">Confirm Migration</h3>
                        <p className="text-sm font-medium text-slate-400 text-center mb-8 leading-relaxed">
                            Are you sure you want to rigorously scan the database and link all orphaned match data to the currently active tournament context?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMigrateConfirm(false)}
                                className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-white text-sm transition-all border border-white/5 uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeMigration}
                                className="flex-1 px-4 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 font-black text-white text-sm transition-all shadow-lg shadow-amber-600/20 uppercase tracking-widest"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {migrationStatus && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#050B14]/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className={`bg-slate-900 border rounded-[32px] p-6 max-w-sm w-full animate-in zoom-in-95 duration-300 ${migrationStatus.type === 'success' ? 'border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.1)]' : 'border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.1)]'}`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto border ${migrationStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            {migrationStatus.type === 'success' ? <CheckCircle className="w-8 h-8 text-emerald-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
                        </div>
                        <h3 className="text-xl font-black text-white text-center mb-3 uppercase tracking-wide">{migrationStatus.type === 'success' ? 'Sync Successful' : 'Sync Failed'}</h3>
                        <div className="text-sm font-medium text-slate-400 text-center mb-8 leading-relaxed max-h-32 overflow-y-auto no-scrollbar">
                            {migrationStatus.message}
                        </div>
                        <button
                            onClick={() => setMigrationStatus(null)}
                            className="w-full px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 font-bold text-white text-sm transition-all border border-white/5 uppercase tracking-widest"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Standardized Premium Header */}
            <header className="sticky top-0 z-[60] bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                <Globe className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                                    League <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">& Tournaments</span>
                                </h1>
                                <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 hidden xs:block">
                                    Platform Data Contexts
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 shrink-0 auto-cols-auto overflow-x-auto no-scrollbar pb-1 -mb-1">
                            <button 
                                onClick={handleMigrateClick}
                                disabled={isMigrating}
                                className="flex items-center justify-center gap-1.5 md:gap-2 bg-slate-800/80 hover:bg-slate-700 text-white px-3 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all border border-slate-700 disabled:opacity-50 uppercase tracking-widest whitespace-nowrap"
                            >
                                {isMigrating ? "Syncing..." : "Run Migration"}
                            </button>
                            <button 
                                onClick={() => setShowNewForm(!showNewForm)}
                                className="flex items-center justify-center gap-1.5 md:gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black transition-all shadow-lg shadow-indigo-600/20 uppercase tracking-widest whitespace-nowrap"
                            >
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> Add <span className="hidden xs:inline">Tournament</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 relative z-10 w-full">
                <p className="text-slate-400 font-medium text-sm md:text-base italic opacity-80 mb-6 md:mb-10 max-w-2xl">
                    Manage high-level league metadata, entry parameters, and synchronize active data contexts.
                </p>

                {showNewForm && (
                     <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 mb-8 backdrop-blur-xl shadow-xl">
                        <h2 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">New Tournament Details</h2>
                        
                        <div className="mb-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl relative z-20">
                            <label className="block text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-2">Quick Select from Cricbuzz</label>
                            
                            {/* CUSTOM DROPDOWN */}
                            <div className="relative">
                                {/* Dropdown Trigger */}
                                <div 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full flex items-center justify-between bg-black/40 border ${isDropdownOpen ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'border-white/10 hover:border-white/20'} rounded-xl px-4 py-3 text-white transition-all cursor-pointer`}
                                >
                                    <span className="font-medium text-sm truncate">
                                        {selectedSeriesId 
                                            ? availableSeries.find(s => s.id === selectedSeriesId)?.name || "-- Choose an ongoing series --" 
                                            : "-- Choose an ongoing series --"}
                                    </span>
                                    <div className="pl-2">
                                        {fetchingSeries ? (
                                            <RefreshCw className="w-4 h-4 text-indigo-500 animate-spin" />
                                        ) : (
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </div>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-slate-900/95 backdrop-blur-xl border border-indigo-500/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                                                <div 
                                                    onClick={() => handleSeriesSelect("")}
                                                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${selectedSeriesId === "" ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                                >
                                                    -- Clear Selection --
                                                </div>
                                                {availableSeries.map(s => (
                                                    <div 
                                                        key={s.id}
                                                        onClick={() => handleSeriesSelect(s.id)}
                                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${selectedSeriesId === s.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                                    >
                                                        {s.name}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
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
            </main>
        </div>
    );
}
