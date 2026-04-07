"use client";

import { useEffect, useState, Suspense } from "react";
import { CheckCircle, Circle, Plus, Trophy, Activity, Globe, Search, RefreshCw, ChevronDown, AlertTriangle, X, XCircle, ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Tournament {
    _id: string;
    name: string;
    cricbuzzSeriesId: string;
    cricbuzzSlug: string;
    isActive: boolean;
    commissionPercentage: number;
    entryFee: number;
}

function TournamentsContent() {
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewForm, setShowNewForm] = useState(false);
    const [isMigrating, setIsMigrating] = useState(false);
    const [showMigrateConfirm, setShowMigrateConfirm] = useState(false);
    const { showToast } = useToast();
    
    // Form state
    const [name, setName] = useState("");
    const [seriesId, setSeriesId] = useState("");
    const [slug, setSlug] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [commissionPercentage, setCommissionPercentage] = useState(5);
    
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
            showToast("Failed to fetch tournaments.", "error");
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
            showToast("Failed to fetch Available Series from Cricbuzz.", "error");
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
                    commissionPercentage
                })
            });
            if (res.ok) {
                setShowNewForm(false);
                setName("");
                setSeriesId("");
                setSlug("");
                setIsActive(false);
                setCommissionPercentage(5);
                showToast("Tournament created successfully!", "success");
                await fetchTournaments();
            } else {
                const error = await res.json();
                showToast(error.message || "Failed to create tournament", "error");
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
                showToast(`Intelligent sync completed! Matches categorized and records stabilized.`, "success");
                await fetchTournaments();
            } else {
                showToast("Migration failed: " + data.message, "error");
            }
        } catch (err) {
            console.error("Migration error", err);
            showToast("Migration critical error occurred.", "error");
        } finally {
            setIsMigrating(false);
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch("/api/admin/tournaments", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, isActive: !currentStatus }) // Toggle the current status
            });
            if (res.ok) {
                showToast(`Tournament status updated!`, "success");
                await fetchTournaments();
            } else {
                showToast("Failed to toggle tournament status.", "error");
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
                        <h3 className="text-xl font-black text-white text-center mb-3 uppercase tracking-wide italic">Data Alignment Sync</h3>
                        <p className="text-sm font-medium text-slate-400 text-center mb-8 leading-relaxed">
                            This operation scans the platform for any unlinked match entries or scores and stabilizes them by binding them to the 
                            <span className="text-indigo-400 font-bold"> {
                                tournaments.filter(t => t.isActive).length > 1 
                                ? `multiple active contexts (${tournaments.filter(t => t.isActive).map(t => t.name).join(", ")})` 
                                : tournaments.find(t => t.isActive)?.name || "Latest Active Tournament"
                            }</span>.
                            <br/><br/>
                            Matches will be intelligently categorized based on their real-world series IDs into the respective active tournaments above.
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

            {/* Migration Confirmation Modal remains for Safety */}

            {/* Header is now at Layout Level */}

            {/* Platform Controls (Repositioned to Content) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                    <Link 
                        href={isPlayerView ? "/dashboard?view=player" : "/admin"}
                        className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col gap-2">
                        <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                            Platform <span className="text-indigo-500 font-black">Data Contexts</span>
                        </h2>
                        <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest px-1 italic">
                            Series Sync & League Metadata Management
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={handleMigrateClick}
                        disabled={isMigrating}
                        className="flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white px-5 py-3.5 rounded-2xl text-[10px] font-black transition-all border border-slate-700 disabled:opacity-50 uppercase tracking-widest whitespace-nowrap active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                        {isMigrating ? "Syncing..." : "Run Migration"}
                    </button>
                    <button 
                        onClick={() => setShowNewForm(!showNewForm)}
                        className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black transition-all shadow-lg uppercase tracking-widest whitespace-nowrap active:scale-95 ${
                            showNewForm 
                            ? "bg-slate-800 hover:bg-slate-700 text-white border border-white/10" 
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                        }`}
                    >
                        {showNewForm ? (
                            <>
                                <X className="w-4 h-4 shrink-0" /> Close Form
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4 shrink-0" /> Add Tournament
                            </>
                        )}
                    </button>
                </div>
            </div>

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
                                    <label className="block text-slate-400 text-xs font-bold mb-2 uppercase tracking-wide text-indigo-400">Platform Commission (%)</label>
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
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Spinner />
                    </div>
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
                                        <button 
                                            onClick={() => handleToggleActive(t._id, t.isActive)}
                                            className={`group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                                                t.isActive 
                                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30" 
                                                : "bg-white/5 hover:bg-indigo-600 border border-white/10 hover:border-indigo-500 text-slate-300 hover:text-white"
                                            }`}
                                        >
                                            {t.isActive ? (
                                                <>
                                                    <Activity className="w-3.5 h-3.5 animate-pulse group-hover:hidden" />
                                                    <XCircle className="w-3.5 h-3.5 hidden group-hover:block" />
                                                    <span className="group-hover:hidden tracking-widest uppercase text-[10px]">Active</span>
                                                    <span className="hidden group-hover:block tracking-widest uppercase text-[10px]">Deactivate</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Circle className="w-3.5 h-3.5 group-hover:hidden" />
                                                    <CheckCircle className="w-3.5 h-3.5 hidden group-hover:block" />
                                                    <span className="tracking-widest uppercase text-[10px]">Set Active</span>
                                                </>
                                            )}
                                        </button>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-xs text-slate-400">
                                        <span className="font-bold text-slate-500 uppercase tracking-wide mr-2 text-[10px]">Slug:</span> 
                                        {t.cricbuzzSlug}
                                    </div>
                                    <div className="flex gap-4 pt-2 border-t border-white/5 mt-2">
                                        <div className="text-xs text-slate-400">
                                            <span className="font-bold text-slate-500 uppercase tracking-wide mr-2 text-[10px]">Platform Fee:</span> 
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

export default function AdminTournamentsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050810] flex items-center justify-center">
                <Spinner />
            </div>
        }>
            <TournamentsContent />
        </Suspense>
    );
}
