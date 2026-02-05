"use client";

import { useEffect, useState, use } from "react";
import { User as UserIcon, Plus, Trash2, ArrowLeft, Swords, Medal, ShieldCheck, Zap, ChevronRight, Gavel, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Slot {
    _id: string;
    inningsNumber: number;
    position: number;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

interface Assignment {
    _id: string;
    userId: { _id: string; name: string };
    inningsNumber: number;
    position: number;
}

interface MatchDetails {
    match: {
        teams: { name: string; shortName: string }[];
        status: string;
    };
    advanced?: any;
}

export default function MatchSlotsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: matchId } = use(params);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [autoAssigning, setAutoAssigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, [matchId]);

    const fetchData = async () => {
        try {
            const [slotsRes, usersRes, assignmentsRes, matchRes] = await Promise.all([
                fetch(`/api/admin/slots?matchId=${matchId}`),
                fetch("/api/admin/users"),
                fetch(`/api/admin/assignments?matchId=${matchId}`),
                fetch(`/api/matches/${matchId}`)
            ]);

            const [slotsData, usersData, assignmentsData, matchData] = await Promise.all([
                slotsRes.json(),
                usersRes.json(),
                assignmentsRes.json(),
                matchRes.json()
            ]);

            setSlots(slotsData);
            setUsers(usersData);
            setAssignments(assignmentsData);
            setMatchDetails(matchData);
            console.log("Batting Slots Page Data:", { slots: slotsData, users: usersData, assignments: assignmentsData, match: matchData });
        } catch (err) {
            console.error("Failed to fetch slot data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateSlots = async () => {
        setGenerating(true);
        try {
            const res = await fetch("/api/admin/slots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId })
            });
            if (res.ok) await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const handleAssign = async (innings: number, position: number, userId: string) => {
        try {
            const res = await fetch("/api/admin/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId, userId, inningsNumber: innings, position })
            });
            if (res.ok) await fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveAssignment = async (id: string) => {
        console.log("Removing Assignment ID:", id);
        try {
            const res = await fetch(`/api/admin/assignments?id=${id}`, { method: "DELETE" });
            const data = await res.json();
            console.log("Deletion response:", data);
            if (res.ok) await fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAutoAssign = async () => {
        setAutoAssigning(true);
        try {
            const res = await fetch("/api/admin/assignments/auto", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ matchId })
            });
            if (res.ok) await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setAutoAssigning(false);
        }
    };

    const getAssignment = (innings: number, pos: number) => {
        return assignments.find(a => a.inningsNumber === innings && a.position === pos);
    };

    const team1 = matchDetails?.match?.teams?.[0]?.shortName || "TBC";
    const team2 = matchDetails?.match?.teams?.[1]?.shortName || "TBC";

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-20">
            {/* Ambient Lighting */}
            <div className="absolute -top-40 left-0 w-[800px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

            {/* Nav & Header */}
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-950/40 p-8 rounded-[32px] border border-white/5 backdrop-blur-xl">
                <div>
                    <Link href="/admin/matches" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors mb-4 text-xs font-black uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> Back to Fixtures
                    </Link>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Gavel className="w-8 h-8 text-indigo-500" />
                        Batting Order <span className="text-slate-500 mx-1">/</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{team1} vs {team2}</span>
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium italic">Strategic assignment of player slots for 10 total positions.</p>
                </div>

                <div className="flex items-center gap-4">
                    {slots.length > 0 && (
                        <>
                            {assignments.length < users.length && (
                                <button
                                    onClick={handleAutoAssign}
                                    disabled={autoAssigning}
                                    className="group relative flex items-center gap-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 disabled:opacity-50 active:scale-95 overflow-hidden"
                                >
                                    <Zap className={`w-4 h-4 ${autoAssigning ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                                    <span className="uppercase tracking-widest text-[10px]">
                                        {autoAssigning ? "Assigning..." : "Auto Assign Players"}
                                    </span>
                                </button>
                            )}
                            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 px-5 py-2.5 rounded-2xl backdrop-blur-md">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span className="text-[10px] font-black text-green-300 uppercase tracking-[0.2em]">Positions Ready</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Innings Grid - Only show if slots are generated */}
            {slots.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
                    {[1, 2].map((innings) => (
                        <div key={innings} className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white flex items-center gap-4">
                                    <span className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-lg font-black shadow-lg shadow-indigo-500/10">
                                        {innings}
                                    </span>
                                    Innings {innings} <span className="text-slate-500 font-bold uppercase text-xs tracking-[0.3em] ml-2">Positions 1-5</span>
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {Array.from({ length: 5 }, (_, i) => i + 1).map((pos) => {
                                    const assignment = getAssignment(innings, pos);
                                    return (
                                        <div key={pos} className="group relative overflow-hidden bg-slate-950/40 border border-white/5 rounded-2xl p-4 hover:border-indigo-500/30 transition-all duration-300 flex items-center gap-6">
                                            {/* Background hover glow */}
                                            <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                            {/* Position Indicator */}
                                            <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-900 border border-white/5 group-hover:bg-slate-800 transition-colors">
                                                <span className="text-[10px] font-black text-slate-500 uppercase leading-none mb-0.5">Pos</span>
                                                <span className="text-base font-black text-white leading-none">{pos}</span>
                                            </div>

                                            {/* User Selection / Display */}
                                            <div className="flex-1 min-w-0 flex items-center">
                                                {assignment ? (
                                                    <div className="flex-1 flex items-center justify-between bg-white/5 p-2 pr-4 rounded-xl border border-white/5 group-hover:border-indigo-500/20 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-600/20">
                                                                {assignment.userId.name.split(' ').map(n => n[0]).join('')}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-black text-white tracking-tight">{assignment.userId.name}</span>
                                                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Assigned</span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveAssignment(assignment._id)}
                                                            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1 relative">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                            <UserIcon className="w-4 h-4 text-slate-600" />
                                                        </div>
                                                        <select
                                                            className="w-full bg-slate-900/50 border border-white/5 text-slate-400 text-xs font-bold rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 hover:border-white/10 transition-all appearance-none uppercase tracking-widest cursor-pointer"
                                                            onChange={(e) => handleAssign(innings, pos, e.target.value)}
                                                            defaultValue=""
                                                        >
                                                            <option value="" disabled>Select Player for Slot {pos}</option>
                                                            {users.map(u => (
                                                                <option key={u._id} value={u._id} className="bg-slate-900 text-white font-bold">{u.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                                                            <ChevronRight className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State / Slots missing */
                <div className="relative z-10 text-center py-24 bg-slate-950/40 border-2 border-dashed border-white/5 rounded-[48px] backdrop-blur-md animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/10">
                        <Swords className="w-10 h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">Database Initialization Required</h3>
                    <p className="text-slate-400 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                        This match has no batting slots defined in the system. <br />
                        Please initialize the **10 core slots** to begin player assignments.
                    </p>
                    <button
                        onClick={handleGenerateSlots}
                        disabled={generating}
                        className="group relative inline-flex items-center gap-3 px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black transition-all shadow-2xl shadow-indigo-600/30 hover:shadow-indigo-600/50 disabled:opacity-50 active:scale-95 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                        <Plus className="w-5 h-5" />
                        <span className="uppercase tracking-[0.2em] text-xs leading-none">
                            {generating ? "Initializing System..." : "Initialize 10 Batting Slots"}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
