"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Trophy, ChevronRight, Clock, Activity, Search, MapPin } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Match {
    _id: string;
    externalMatchId: string;
    teams: { name: string; shortName: string }[];
    status: string;
    startTime: string;
    venue: string;
}

export default function AllMatchesPage() {
    const { data: session } = useSession();
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'finished'>('upcoming');
    const [searchQuery, setSearchQuery] = useState("");

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/matches");
            const data = await res.json();
            if (res.ok) setMatches(data);
        } catch (err) {
            console.error("Failed to load matches", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const today = new Date().toDateString();

    const filteredMatches = matches.filter(m => {
        const teamNames = m.teams.map(t => t.name.toLowerCase() + t.shortName.toLowerCase()).join(" ");
        return teamNames.includes(searchQuery.toLowerCase());
    });

    const upcomingMatches = filteredMatches.filter(m => {
        const status = m.status.toLowerCase();
        const isUpcoming = status === 'upcoming' || status === 'live';
        return isUpcoming;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const finishedMatches = filteredMatches.filter(m => {
        const status = m.status.toLowerCase();
        return status === 'finished' || status === 'completed' || status === 'result' || status === 'settled';
    }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const displayMatches = activeTab === 'upcoming' ? upcomingMatches : finishedMatches;

    return (
        <div className="min-h-screen bg-[#050B14] pb-20 relative overflow-x-hidden">
            {/* Ambient Backlight */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
                    <Link href="/dashboard" className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-indigo-500" />
                        <h1 className="text-xl font-black text-white tracking-tight">FULL <span className="text-indigo-500">SCHEDULE</span></h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 pt-10">
                {/* Search & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-6 border-b border-white/10 flex-1 md:flex-none">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'upcoming' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Upcoming
                            {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                        </button>
                        <button
                            onClick={() => setActiveTab('finished')}
                            className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'finished' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            Past Results
                            {activeTab === 'finished' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500" />}
                        </button>
                    </div>

                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search teams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                        />
                    </div>
                </div>

                {/* List - 2 Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-56 w-full bg-slate-900/30 rounded-3xl animate-pulse border border-white/5" />
                        ))
                    ) : displayMatches.length > 0 ? (
                        displayMatches.map(match => <StandardMatchCard key={match._id} match={match} />)
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-30">
                            <Calendar className="w-16 h-16 text-slate-500 mb-4" />
                            <p className="text-white font-bold uppercase tracking-widest">No matches found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function StandardMatchCard({ match }: { match: Match }) {
    const date = new Date(match.startTime);
    const isFinished = match.status === 'finished' ||
        match.status === 'completed' ||
        match.status === 'result' ||
        match.status === 'settled';
    const isLive = match.status === 'live';

    return (
        <Link href={`/matches/${match._id}`} className="group relative flex flex-col p-6 bg-slate-900/40 border border-white/5 rounded-3xl hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden shadow-lg h-full">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

            {/* Top Section: Status & Time */}
            <div className="flex justify-between items-center mb-6">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${isLive ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                    isFinished ? 'bg-slate-800 border-white/5 text-slate-500' :
                        'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                    {isLive ? (
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Live Now
                        </span>
                    ) : isFinished ? 'Completed' : 'Upcoming'}
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>

            {/* Middle Section: Teams Grid */}
            <div className="flex items-center justify-between gap-4 mb-8 px-2">
                <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/40 transition-all shadow-inner">
                        <span className="text-2xl font-black text-white">{match.teams[0].shortName}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full">{match.teams[0].name}</span>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-xs font-black text-slate-700 mb-2">VS</div>
                    <div className="w-px h-10 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
                </div>

                <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/40 transition-all shadow-inner">
                        <span className="text-2xl font-black text-white">{match.teams[1].shortName}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full">{match.teams[1].name}</span>
                </div>
            </div>

            {/* Bottom Section: Venue */}
            <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wide truncate max-w-[200px]">
                        {match.venue.split(',')[0]}
                    </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                    <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-white" />
                </div>
            </div>
        </Link>
    );
}
