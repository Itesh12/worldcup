"use client";

import { useEffect, useState, use, Suspense } from "react";
import { ArrowLeft, User, Target, Zap, Info, Calendar, MapPin, Users, Activity, Trophy, X, Star, PartyPopper, RefreshCw, Ban, AlertCircle, Lock, Copy, CheckCircle2, Share2, Swords, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { ArenaSelectionDialog } from "@/components/ArenaSelectionDialog";
import { CreateArenaModal } from "@/components/dashboard/CreateArenaModal";
import { useToast } from "@/contexts/ToastContext";
import { ArenaDetailView } from "@/components/dashboard/ArenaDetailView";

interface SlotData {
    inningsNumber: number;
    position: number | null;
    isRevealed: boolean;
    revealTime: string;
    arenaId: string;
    arenaName: string;
    resolution?: {
        playerName: string;
    };
    score?: {
        runs: number;
        balls: number;
        fours: number;
        sixes: number;
        isOut: boolean;
    };
}

function RevealCountdown({ targetDate, onComplete }: { targetDate: string, onComplete: () => void }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const calculate = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();
            if (difference <= 0) {
                onComplete();
                setTimeLeft("REVEALING...");
                return;
            }

            const hours = Math.floor(difference / 1000 / 60 / 60);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            let result = "";
            if (hours > 0) result += `${hours}h `;
            result += `${minutes}m ${seconds}s`;
            return result;
        };

        const timer = setInterval(() => {
            const result = calculate();
            if (result) setTimeLeft(result);
            else clearInterval(timer);
        }, 1000);

        const initial = calculate();
        if (initial) setTimeLeft(initial);

        return () => clearInterval(timer);
    }, [targetDate, onComplete]);

    return (
        <span className="text-indigo-400 font-black tabular-nums">{timeLeft}</span>
    );
}

function AuthBackdrop({ message }: { message: string }) {
    return (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-900/20 border border-white/5 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-white/5 relative z-10">
                <Trophy className="w-8 h-8 text-indigo-500/50" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8 max-w-sm px-8 leading-loose relative z-10">
                {message}
            </p>
            <Link href="/login" className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-indigo-600/20 active:scale-95 relative z-10">
                Sign In to View
            </Link>
        </div>
    );
}

function SectionHeader({ title, icon: Icon, color }: { title: string; icon: any; color: string }) {
    const colorMap: any = {
        blue: 'text-blue-500',
        indigo: 'text-indigo-500',
        slate: 'text-slate-400',
        purple: 'text-purple-500'
    };
    const underlineMap: any = {
        blue: 'decoration-blue-600/30',
        indigo: 'decoration-indigo-500/30',
        purple: 'decoration-purple-500/30'
    };
    return (
        <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className={`p-2.5 md:p-3 bg-[#0A0F1C] rounded-xl md:rounded-2xl border border-white/5 ${colorMap[color] || colorMap.indigo} shadow-lg shadow-indigo-500/5`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h2 className={`text-xl md:text-3xl font-black text-white tracking-tight underline ${underlineMap[color] || underlineMap.indigo} underline-offset-4 md:underline-offset-8 decoration-2 md:decoration-4 uppercase md:normal-case`}>{title}</h2>
        </div>
    );
}

function StatItem({ label, value, primary = false }: { label: string; value: string | number; primary?: boolean }) {
    return (
        <div className="flex flex-col min-w-[40px]">
            <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase mb-1 md:mb-2 tracking-widest">{label}</span>
            <span className={`text-xl md:text-3xl font-black ${primary ? 'text-indigo-500' : 'text-white'}`}>{value}</span>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800/80 border-dashed rounded-[2.5rem] p-16 text-center">
            <Activity className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-50" />
            <p className="text-slate-500 font-bold max-w-xs mx-auto text-lg leading-snug">{message}</p>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
        <div className="flex justify-between items-center p-6 px-8 hover:bg-slate-800/30 transition-colors">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-sm font-bold text-white text-right max-w-[60%]">{value}</span>
        </div>
    );
}

function ScorecardInnings({ team, isFirst = false }: { team: any; isFirst?: boolean }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className={`p-4 md:p-6 px-4 md:px-12 flex justify-between items-center border-b border-slate-800 ${isFirst ? 'bg-indigo-600/10' : 'bg-slate-800/20'}`}>
                <h3 className="text-sm md:text-xl font-black text-white truncate mr-2">{team.name}</h3>
                <span className="text-lg md:text-2xl font-black text-indigo-500 underline decoration-2 underline-offset-4 whitespace-nowrap">{team.score}</span>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-800">
                            <th className="p-3 md:p-4 px-6 md:px-12 text-left text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[40%]">Batter</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">R</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">B</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">4s</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">6s</th>
                            <th className="p-3 md:p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">SR</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {team.batting.map((b: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="p-4 px-6 md:px-12">
                                    <div className="flex flex-col">
                                        <span className="text-xs md:text-sm font-black text-white group-hover:text-indigo-500 transition-colors block mb-0.5">{b.name}</span>
                                        <span className="text-[9px] md:text-[10px] font-medium text-slate-500 leading-tight italic">{b.outStatus}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center font-black text-white text-xs md:text-base">{b.runs}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-bold text-slate-400">{b.balls}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-bold text-slate-400">{b.fours}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-bold text-slate-400">{b.sixes}</td>
                                <td className="p-4 text-center text-[11px] md:text-sm font-black text-indigo-400/80">
                                    {b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Bowling Stats */}
            <div className="overflow-x-auto scrollbar-hide border-t border-slate-800/50">
                <table className="w-full min-w-[500px]">
                    <thead>
                        <tr className="bg-slate-950/50 border-b border-slate-800">
                            <th className="p-4 px-6 md:px-12 text-left text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[40%]">Bowler</th>
                            <th className="p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">O</th>
                            <th className="p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">M</th>
                            <th className="p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">R</th>
                            <th className="p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">W</th>
                            <th className="p-4 text-center text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest w-[12%]">ECO</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {team.bowling && team.bowling.map((b: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-800/20 transition-colors group">
                                <td className="p-4 px-6 md:px-12 font-black text-white group-hover:text-indigo-500 text-xs md:text-sm">{b.name}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-bold text-slate-400">{b.overs}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-bold text-slate-400">{b.maidens}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-black text-white">{b.runs}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-black text-indigo-500">{b.wickets}</td>
                                <td className="p-4 text-center text-[10px] md:text-sm font-bold text-slate-400">{b.economy}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* FOW */}
            {team.fow && team.fow.length > 0 && (
                <div className="bg-slate-950/30 p-4 md:p-6 px-6 md:px-12 border-t border-slate-800/50">
                    <p className="text-[8px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 md:mb-2 text-center md:text-left">Fall of Wickets</p>
                    <p className="text-[9px] md:text-xs font-medium text-slate-400 leading-relaxed text-center md:text-left italic">{team.fow.join(', ')}</p>
                </div>
            )}
        </div>
    );
}

function TeamSquad({ team, color }: { team: any; color: string }) {
    const glowMap: any = {
        indigo: 'shadow-indigo-600/10',
        purple: 'shadow-purple-600/10'
    };
    return (
        <div className={`flex flex-col gap-6 bg-slate-900/30 p-8 rounded-[2.5rem] border border-slate-800/80 ${glowMap[color]} shadow-2xl`}>
            <h3 className="text-2xl font-black text-white mb-4 border-l-4 border-indigo-600 pl-4">{team.name}</h3>
            <div className="space-y-4">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[3px]">Playing XI</p>
                <div className="grid gap-3">
                    {team.playingXI.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50 hover:bg-slate-900 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-black text-white">{p.name}</span>
                                {p.isCaptain && <span className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-md uppercase">C</span>}
                                {p.isWK && <span className="px-2 py-0.5 bg-slate-700 text-[8px] font-black text-white rounded-md uppercase">WK</span>}
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{p.role}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bench */}
            {team.bench && team.bench.length > 0 && (
                <div className="space-y-4 pt-6 border-t border-slate-800/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px]">Bench</p>
                    <div className="grid gap-3">
                        {team.bench.map((p: any, i: number) => (
                            <div key={i} className="flex justify-between items-center bg-slate-950/30 p-4 rounded-2xl border border-slate-800/30 hover:bg-slate-900 transition-colors opacity-75 hover:opacity-100">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-300">{p.name}</span>
                                    {p.isCaptain && <span className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-md uppercase">C</span>}
                                    {p.isWK && <span className="px-2 py-0.5 bg-slate-700 text-[8px] font-black text-white rounded-md uppercase">WK</span>}
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{p.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


function MatchDetailContent({ params }: { params: Promise<{ id: string }> }) {
    const { showToast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id: matchId } = use(params);
    const { data: session, status } = useSession();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'hosted' | 'slots' | 'scorecard' | 'squads' | 'info'>('slots');
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [hasShownPopup, setHasShownPopup] = useState(false);
    const [isArenaDialogOpen, setIsArenaDialogOpen] = useState(false);
    const [matchForHosting, setMatchForHosting] = useState<any>(null);
    const [hostedArenas, setHostedArenas] = useState<any[]>([]);
    const [loadingHosted, setLoadingHosted] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
    const [selectedArenaId, setSelectedArenaId] = useState<string | null>(null);

    const fetchHostedArenas = async () => {
        if (!session) return;
        setLoadingHosted(true);
        try {
            const res = await fetch(`/api/arenas?matchId=${matchId}&filter=hosted`);
            const result = await res.json();
            if (res.ok) setHostedArenas(result);
        } catch (err) {
            console.error("Error fetching hosted arenas:", err);
        } finally {
            setLoadingHosted(false);
        }
    };

    const fetchMatchData = async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            // Trigger a background sync for this match specifically to ensure latest batting scores
            // Await this to ensure we display fresh data after reload
            await fetch(`/api/sync?matchId=${matchId}`, {
                headers: { 'x-silent-fetch': 'true' }
            }).catch(e => console.error("Auto-sync error", e));

            const res = await fetch(`/api/matches/${matchId}`);
            const result = await res.json();
            if (res.ok) {
                setData(result);
                setLastUpdated(new Date());
                if (session && activeTab === 'hosted') {
                    fetchHostedArenas();
                }
            } else {
                showToast(result.message || "Failed to load match details", "error");
                setError(result.message || "Failed to load match details");
            }
        } catch (err) {
            showToast("Connectivity issue. Please try again.", "error");
            setError("Connectivity issue. Please try again.");
        } finally {
            setLoading(false);
            if (isManual) setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMatchData();
    }, [matchId]);

    // Check for match completion
    useEffect(() => {
        const ms = data?.match?.status?.toLowerCase();
        const finished = ms === 'finished' || ms === 'completed' || ms === 'result' || ms === 'settled';

        if (finished && !hasShownPopup) {
            setHasShownPopup(true);
        }
    }, [data?.match?.status, hasShownPopup]);

    // Handle Direct URL Joining via Invite Code
    useEffect(() => {
        const code = searchParams.get('code');
        
        // 1. If user is unauthenticated and has a code, redirect to login with callback
        if (code && status === 'unauthenticated') {
            const callbackUrl = window.location.href;
            router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            return;
        }

        // 2. If user is authenticated and has a code, trigger dialog
        if (code && status === 'authenticated' && data) {
            setIsArenaDialogOpen(true);
        }
    }, [status, searchParams, data, router]);

    useEffect(() => {
        if (activeTab === 'hosted') {
            fetchHostedArenas();
        }
    }, [activeTab]);

    if (loading) return (
        <div className="min-h-screen bg-[#050810] flex items-center justify-center">
            <Spinner />
        </div>
    );

    if (!data) return (
        <div className="min-h-screen bg-[#050810] flex items-center justify-center p-8 text-center">
            <div className="bg-slate-900/50 border border-slate-800 p-12 rounded-[3rem] max-w-sm backdrop-blur-xl">
                <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Trophy className="w-10 h-10 text-slate-700" />
                </div>
                <h3 className="text-2xl font-black text-white mb-3">Fixture Not Found</h3>
                <p className="text-slate-500 mb-10 font-medium">This match may have been archived or removed from the active series.</p>
                <Link href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Return Home
                </Link>
            </div>
        </div>
    );

    const { match, slots, advanced } = data;
    const matchStatus = match?.status?.toLowerCase() || '';
    const isFinished = matchStatus === 'finished' || matchStatus === 'completed' || matchStatus === 'result' || matchStatus === 'settled';

    // Grouping slots by arenaId for better lookup
    const groupedSlots = slots.reduce((acc: any, slot: SlotData) => {
        const key = slot.arenaId;
        if (!acc[key]) {
            acc[key] = {
                name: slot.arenaName,
                slots: []
            };
        }
        acc[key].slots.push(slot);
        return acc;
    }, {});

    // Helper to find score for a specific team from the advanced scorecard
    const getTeamScore = (teamName: string) => {
        if (!advanced?.scorecard) return null;
        const { team1, team2 } = advanced.scorecard;
        // Case-insensitive name matching because Cricbuzz names might differ slightly (e.g., "India" vs "IND")
        if (team1?.name?.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(team1?.name?.toLowerCase())) {
            return team1.score;
        }
        if (team2?.name?.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(team2?.name?.toLowerCase())) {
            return team2.score;
        }
        return null;
    };

    const tabs = [
        { id: 'hosted', label: 'My Arenas', icon: Swords },
        { id: 'slots', label: 'My Slots', icon: Target },
        { id: 'scorecard', label: 'Scorecard', icon: Activity },
        { id: 'squads', label: 'Squads', icon: Users },
        { id: 'info', label: 'Match Info', icon: Info },
    ];

    return (
        <div className="min-h-screen bg-[#050810] text-slate-200">
            {/* Standardized Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-6">
                        <Link href="/dashboard" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                        <div className="flex items-center gap-2 md:gap-3">
                            <Activity className="w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                            <h1 className="text-lg md:text-xl font-black text-white tracking-tight">MATCH <span className="text-indigo-500">CENTER</span></h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Auto-sync active</span>
                            {lastUpdated && (
                                <span className="text-[8px] font-bold text-slate-500">Synced: {lastUpdated.toLocaleTimeString()}</span>
                            )}
                        </div>
                        <button
                            onClick={() => fetchMatchData(true)}
                            disabled={refreshing}
                            className={`p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all hover:bg-slate-800 group ${refreshing ? 'cursor-not-allowed opacity-50' : ''} shadow-lg`}
                            title="Refresh Match Data"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/5 shadow-inner">
                            <span className={`w-1.5 h-1.5 rounded-full ${match.status === 'live' ? 'bg-green-500 animate-pulse' : 'bg-slate-700'}`} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {match.status}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="pt-24 pb-10 md:pb-12 px-4 border-b border-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="relative mt-4 md:mt-12 bg-[#0A0F1C]/40 border border-white/5 rounded-[2rem] md:rounded-[3.5rem] p-4 sm:p-6 md:p-16 backdrop-blur-2xl overflow-hidden group">
                        {/* Glassy Background Elements */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-48 md:w-96 h-48 md:h-96 bg-indigo-500/10 blur-[80px] md:blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />
                        <div className="absolute -bottom-24 -right-24 w-48 md:w-96 h-48 md:h-96 bg-purple-500/10 blur-[80px] md:blur-[120px] rounded-full animate-pulse-slow pointer-events-none delay-1000" />

                        <div className="relative z-10 flex flex-row items-center justify-between gap-2 sm:gap-4 md:gap-12 py-4 md:py-8">
                            {/* Team 1 */}
                            <div className="flex flex-col items-center flex-1 text-center group min-w-0">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-2 border-slate-800 flex items-center justify-center mb-2 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-indigo-500/10">
                                    <span className="text-xl sm:text-3xl md:text-5xl font-black text-white">{match.teams[0].shortName}</span>
                                </div>
                                <h2 className="text-[10px] sm:text-lg md:text-2xl font-black text-white tracking-tight px-1 truncate w-full">{match.teams[0].name}</h2>
                                {getTeamScore(match.teams[0].name) && (
                                    <p className="text-sm sm:text-2xl md:text-3xl font-black text-indigo-400 mt-0.5 md:mt-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-in fade-in zoom-in duration-500">
                                        {getTeamScore(match.teams[0].name)}
                                    </p>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="flex flex-col items-center py-2 md:py-0 px-2">
                                <div className="px-3 py-1 md:px-6 md:py-2 bg-slate-900/50 rounded-full border border-slate-800 mb-1 md:mb-4 backdrop-blur-md">
                                    <span className="text-[10px] md:text-sm font-black italic text-slate-600">VS</span>
                                </div>
                                <p className="text-[8px] md:text-xs font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">
                                    {advanced?.info?.date || new Date(match.startTime).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                    <span className="mx-2 text-slate-800">•</span>
                                    {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </p>
                            </div>

                            {/* Team 2 */}
                            <div className="flex flex-col items-center flex-1 text-center group min-w-0">
                                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-slate-800 flex items-center justify-center mb-2 md:mb-6 group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-purple-500/10">
                                    <span className="text-xl sm:text-3xl md:text-5xl font-black text-white">{match.teams[1].shortName}</span>
                                </div>
                                <h2 className="text-[10px] sm:text-lg md:text-2xl font-black text-white tracking-tight px-1 truncate w-full">{match.teams[1].name}</h2>
                                {getTeamScore(match.teams[1].name) && (
                                    <p className="text-sm sm:text-2xl md:text-3xl font-black text-purple-500 mt-0.5 md:mt-2 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] animate-in fade-in zoom-in duration-500">
                                        {getTeamScore(match.teams[1].name)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex items-center gap-4 sm:gap-6 md:gap-8 mb-8 md:mb-12 border-b border-white/10 pb-1 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3 md:pb-4 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all relative flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            <tab.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-600'}`} />
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'hosted' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <SectionHeader title="Your Hosted Arenas" icon={Swords} color="purple" />
                            {!isFinished && session && (
                                <button 
                                    onClick={() => setMatchForHosting(match)}
                                    className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black italic uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                >
                                    <Swords className="w-4 h-4" />
                                    Host New Arena
                                </button>
                            )}
                        </div>

                        {!session ? (
                            <AuthBackdrop message="Sign in to view and manage your hosted arenas." />
                        ) : loadingHosted ? (
                            <div className="py-20 flex justify-center">
                                <Spinner />
                            </div>
                        ) : hostedArenas.length === 0 ? (
                            <EmptyState message="You haven't hosted any arenas for this match yet." />
                        ) : (
                            <div className="grid gap-6">
                                {hostedArenas.map((arena: any) => (
                                    <div key={arena._id} className="relative overflow-hidden bg-[#0A0F1C]/60 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-3xl group hover:border-purple-500/30 transition-all shadow-2xl">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />
                                        
                                        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center justify-between relative z-10">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">{arena.name}</h3>
                                                    {arena.isPrivate && (
                                                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                            Private
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        <span className="text-xs font-bold uppercase tracking-widest">{arena.slotsCount} / {arena.maxSlots} Slots</span>
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                                                    <div className="flex items-center gap-2">
                                                        <Activity className={`w-4 h-4 ${arena.status === 'full' ? 'text-red-500' : 'text-emerald-500'}`} />
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${arena.status === 'full' ? 'text-red-500/80' : 'text-emerald-500/80'}`}>{arena.status}</span>
                                                    </div>
                                                </div>
                                            </div>

                                                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                                    <button 
                                                        onClick={() => setSelectedArenaId(arena._id)}
                                                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 border border-white/5 rounded-xl hover:border-indigo-500/50 transition-all text-[10px] font-black text-indigo-400 uppercase tracking-widest group"
                                                    >
                                                        <Trophy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                                        View Standings
                                                    </button>

                                                    {arena.isPrivate && arena.inviteCode && (
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Contest Access</span>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(arena.inviteCode);
                                                                    setCopiedId(arena._id);
                                                                    showToast("Invite code copied!", "success");
                                                                    setTimeout(() => setCopiedId(null), 2000);
                                                                }}
                                                                className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-white/10 rounded-xl hover:border-purple-500/50 transition-all group"
                                                                title="Copy Invite Code"
                                                            >
                                                                <span className="text-sm font-black text-white tracking-widest">{arena.inviteCode}</span>
                                                                {copiedId === arena._id ? (
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400" />
                                                                )}
                                                            </button>

                                                            <button 
                                                                onClick={() => {
                                                                    const shareUrl = `${window.location.origin}/matches/${matchId}?code=${arena.inviteCode}`;
                                                                    navigator.clipboard.writeText(shareUrl);
                                                                    setCopiedLinkId(arena._id);
                                                                    showToast("Deep-link URL copied to clipboard!", "success");
                                                                    setTimeout(() => setCopiedLinkId(null), 2000);
                                                                }}
                                                                className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                                                title="Share Deep-Link URL"
                                                            >
                                                                {copiedLinkId === arena._id ? (
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                ) : (
                                                                    <Share2 className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex flex-col items-end gap-1.5 ml-auto md:ml-0 px-6 border-l border-white/5">
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Entry Fee</span>
                                                    <span className="text-2xl font-black text-indigo-400">₹{arena.entryFee}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'slots' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <SectionHeader title="Your Assignments" icon={Target} color="indigo" />
                            {!isFinished && session && (
                                <button 
                                    onClick={() => setIsArenaDialogOpen(true)}
                                    className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black italic uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                                >
                                    <Swords className="w-4 h-4" />
                                    Join More Arenas
                                </button>
                            )}
                        </div>

                        {!session ? (
                            <AuthBackdrop message="Personalized assignments are private. Sign in to view your batting slots." />
                        ) : Object.keys(groupedSlots).length === 0 ? (
                            <EmptyState message="You haven't been assigned to any slots yet. Launch into an arena to start playing!" />
                        ) : (
                            <div className="space-y-16">
                                {Object.entries(groupedSlots).map(([arenaId, group]: [string, any], aIdx) => (
                                    <div key={aIdx} className="space-y-6">
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                            <button 
                                                onClick={() => setSelectedArenaId(arenaId)}
                                                className="flex items-center gap-3 px-6 py-2 bg-slate-900/40 border border-white/5 rounded-full backdrop-blur-md hover:border-indigo-500/50 transition-all group"
                                            >
                                                <Zap className="w-3 h-3 text-purple-400 group-hover:scale-110 transition-transform" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">{group.name}</span>
                                                <ChevronRight className="w-3 h-3 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        </div>

                                        <div className="grid gap-6">
                                            {group.slots.map((slot: SlotData, idx: number) => {
                                                const isRevealed = slot.isRevealed;

                                                return (
                                                    <div key={idx} className={`relative overflow-hidden ${!isRevealed ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-[#0A0F1C]/60 border-white/5'} border rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 backdrop-blur-3xl group hover:border-indigo-500/30 transition-all flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between shadow-2xl`}>
                                                        {/* Slot Content (keeping original layout) */}
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                                                        <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto relative z-10">
                                                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform ${isRevealed ? 'bg-indigo-600 shadow-indigo-600/20 group-hover:scale-110' : 'bg-slate-800 border border-white/5 animate-pulse'}`}>
                                                                <span className="text-[8px] md:text-[10px] font-black text-indigo-100/50 uppercase mb-0.5">Pos</span>
                                                                <span className={`text-lg md:text-2xl font-black text-white leading-none ${!isRevealed ? 'tracking-widest' : ''}`}>
                                                                    {isRevealed ? slot.position : "??"}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 className="text-lg md:text-xl font-black text-white tracking-tight uppercase">
                                                                    Innings {slot.inningsNumber}
                                                                </h3>
                                                                <div className="flex items-center gap-2 mt-1 md:mt-2">
                                                                    <div className={`w-3.5 h-3.5 md:w-4 md:h-4 rounded-full flex items-center justify-center ${isRevealed ? 'bg-indigo-500/20' : 'bg-amber-500/20'}`}>
                                                                        {isRevealed ? (
                                                                            <Activity className="w-2 md:w-2.5 h-2 md:h-2.5 text-indigo-500" />
                                                                        ) : (
                                                                            <Lock className="w-2 md:w-2.5 h-2 md:h-2.5 text-amber-500" />
                                                                        )}
                                                                    </div>
                                                                    <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] whitespace-nowrap ${isRevealed ? 'text-indigo-400/80' : 'text-amber-500/80'}`}>
                                                                        {isRevealed ? (
                                                                            `Playing as ${slot.resolution?.playerName || "TBD"}`
                                                                        ) : (
                                                                            <span className="flex items-center gap-2">
                                                                                Position reveal in <RevealCountdown targetDate={slot.revealTime} onComplete={() => fetchMatchData(true)} />
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex gap-4 md:gap-10 items-end md:items-center flex-wrap md:flex-nowrap border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-10 relative z-10 w-full md:w-auto justify-between md:justify-end">
                                                            {isRevealed ? (
                                                                <>
                                                                    <div className="flex gap-4 sm:gap-6 md:gap-10 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
                                                                        <StatItem label="RUNS" value={slot.score?.runs ?? 0} primary />
                                                                        <StatItem label="BALLS" value={slot.score?.balls ?? 0} />
                                                                        <StatItem label="4s" value={slot.score?.fours ?? 0} />
                                                                        <StatItem label="6s" value={slot.score?.sixes ?? 0} />
                                                                        <StatItem label="S/R" value={slot.score?.balls ? ((slot.score.runs / slot.score.balls) * 100).toFixed(1) : '0.0'} />
                                                                    </div>
                                                                    <div className="flex flex-col items-end shrink-0">
                                                                        <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase mb-1 md:mb-2 tracking-widest">Status</span>
                                                                        <span className={`px-3 md:px-4 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest ${slot.score?.isOut ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                                                                            {slot.score?.isOut ? 'OUT' : ((slot.score?.balls ?? 0) > 0 ? 'BATTING' : 'DNB')}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div className="flex flex-col items-end gap-1">
                                                                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                                                                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                                                                        <span className="text-[10px] font-black text-white italic tracking-widest uppercase">Blind Draft Active</span>
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
                        )}
                    </div>
                )}



                {activeTab === 'scorecard' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {advanced?.scorecard ? (
                            <>
                                {advanced.scorecard.team1?.batting?.length > 0 && (
                                    <ScorecardInnings team={advanced.scorecard.team1} isFirst />
                                )}
                                {advanced.scorecard.team2?.batting?.length > 0 && (
                                    <ScorecardInnings team={advanced.scorecard.team2} />
                                )}
                                {(!advanced.scorecard.team1?.batting?.length && !advanced.scorecard.team2?.batting?.length) && (
                                    <EmptyState message="Full scorecard not available yet. The match hasn't started batting." />
                                )}
                            </>
                        ) : (
                            <EmptyState message="Full scorecard not available yet. Synchronizing..." />
                        )}
                    </div>
                )}

                {activeTab === 'squads' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {advanced?.squads ? (
                            <div className="grid md:grid-cols-2 gap-12">
                                <TeamSquad team={advanced.squads.team1} color="indigo" />
                                <TeamSquad team={advanced.squads.team2} color="purple" />
                            </div>
                        ) : (
                            <EmptyState message="Squad details are being fetched..." />
                        )}
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionHeader title="Match Facts" icon={Info} color="slate" />
                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-800">
                            {advanced?.info ? (
                                <>
                                    <InfoRow label="Series" value={advanced.info.series} />
                                    <InfoRow label="Match" value={advanced.info.match} />
                                    <InfoRow label="Venue" value={advanced.info.venue} />
                                    <InfoRow label="Toss" value={advanced.info.toss} />
                                    <InfoRow label="Umpires" value={advanced.info.umpires} />
                                    <InfoRow label="Officials" value={advanced.info.matchReferee} />
                                </>
                            ) : (
                                <InfoRow label="Venue" value={match.venue} />
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Dialogs */}

            <ArenaSelectionDialog
                isOpen={isArenaDialogOpen}
                onClose={() => setIsArenaDialogOpen(false)}
                matchId={matchId}
                matchName={`${match.teams[0].shortName} VS ${match.teams[1].shortName}`}
                onJoinSuccess={() => fetchMatchData(true)}
                onHostClick={() => setMatchForHosting(match)}
                isMatchFinished={isFinished}
            />

            {matchForHosting && (
                <CreateArenaModal
                    isOpen={!!matchForHosting}
                    onClose={() => setMatchForHosting(null)}
                    matchId={matchId}
                    matchName={`${match.teams[0].shortName} vs ${match.teams[1].shortName}`}
                    onSuccess={() => fetchMatchData(true)}
                />
            )}

            <ArenaDetailView 
                isOpen={!!selectedArenaId}
                onClose={() => setSelectedArenaId(null)}
                arenaId={selectedArenaId || ""}
                matchId={matchId}
            />
        </div>
    );
}

export default function MatchDetailPage(props: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#050810] flex items-center justify-center">
                <Spinner />
            </div>
        }>
            <MatchDetailContent params={props.params} />
        </Suspense>
    );
}
