
"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Search, Trophy, ChevronRight, Clock, Battery, Signal, Wifi, Activity, ArrowRight, TrendingUp, LayoutDashboard, Zap } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ProfileDialog } from "@/components/ProfileDialog";

interface Match {
  _id: string;
  externalMatchId: string;
  teams: { name: string; shortName: string }[];
  status: string;
  startTime: string;
  venue: string;
}

export default function UserMatchesPage() {
  const { data: session } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'finished'>('upcoming');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userStats, setUserStats] = useState<{ totalRuns: number; rank: number } | null>(null);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    handleAutoSync();
  }, []);

  const handleAutoSync = async () => {
    try {
      // Trigger the background sync (this activates GlobalLoader via interceptor)
      await fetch("/api/matches/sync", { method: "POST" });
    } catch (err) {
      console.error("Auto-sync failed", err);
    } finally {
      // Fetch the updated matches from our DB
      fetchMatches();
      fetchDashboardStats();
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const [statsRes, leaderboardRes] = await Promise.all([
        fetch("/api/user/stats"),
        fetch("/api/leaderboard?limit=3")
      ]);

      if (statsRes.ok) {
        setUserStats(await statsRes.json());
      }
      if (leaderboardRes.ok) {
        setTopPlayers(await leaderboardRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch dashboard stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      if (res.ok) setMatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic for Sections ---
  const today = new Date().toDateString();

  // 1. Live & Today Sort
  const heroMatches = matches.filter(m => {
    const isLive = m.status === 'live';
    const isToday = new Date(m.startTime).toDateString() === today;
    return isLive || isToday;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // 2. Upcoming
  const upcomingMatches = matches.filter(m => {
    const isFuture = m.status === 'upcoming';
    const isToday = new Date(m.startTime).toDateString() === today;
    return isFuture && !isToday;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // Ascending

  // 3. Finished
  const finishedMatches = matches.filter(m =>
    m.status === 'finished' ||
    m.status === 'completed' ||
    m.status === 'result' ||
    m.status === 'settled'
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()); // Descending

  return (
    <div className="min-h-screen bg-[#050B14] pb-20 relative overflow-x-hidden">
      {/* Ambient Backlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Nav */}
      <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-indigo-500" />
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none">WORLD CUP <span className="text-indigo-500">HUB</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden md:block">Official Player Portal</p>
            </div>
          </div>

          {session?.user ? (
            <>
              {(session.user as any).role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/5 mr-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                  Admin
                </Link>
              )}

              <div
                className="flex items-center gap-4 cursor-pointer group"
                onClick={() => setIsProfileOpen(true)}
              >
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-bold text-white leading-none group-hover:text-indigo-400 transition-colors">{(session.user as any).name}</span>
                  <span className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">{(session.user as any).role}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all">
                  <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden">
                    {(session.user as any).image ? (
                      <img src={(session.user as any).image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-white text-sm">{(session.user.name || "U")?.[0]}</span>
                    )}
                  </div>
                </div>
              </div>

              {isProfileOpen && (
                <ProfileDialog
                  isOpen={isProfileOpen}
                  onClose={() => setIsProfileOpen(false)}
                  user={{
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                    role: (session.user as any).role
                  }}
                />
              )}
            </>
          ) : (
            <Link href="/login" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-12">

        {/* HERO: Today's / Live Matches */}
        {heroMatches.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <span className="w-2 h-8 bg-indigo-500 rounded-full" />
                Matchday Action
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase border border-red-500/20 animate-pulse">
                  Live Updates
                </span>
              </h2>
              {heroMatches.length > 1 && (
                <div className="flex gap-2">
                  <span className="text-xs text-slate-500 font-medium">Scroll for more</span>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                </div>
              )}
            </div>

            {/* Horizontal Scroll Snap Container */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 scrollbar-hide">
              {heroMatches.map((match) => (
                <div key={match._id} className="snap-center shrink-0 w-full md:w-[600px]">
                  <HeroMatchCard match={match} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex items-center gap-8 mb-8 border-b border-white/10 pb-1">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'upcoming' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Upcoming Fixtures
                {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`pb-3 text-sm font-bold uppercase tracking-widest transition-all relative ${activeTab === 'finished' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Past Results
                {activeTab === 'finished' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {activeTab === 'upcoming' ? (
                upcomingMatches.length > 0 ? (
                  upcomingMatches.map(match => <StandardMatchCard key={match._id} match={match} />)
                ) : (
                  <EmptyState message="No upcoming matches scheduled." />
                )
              ) : (
                finishedMatches.length > 0 ? (
                  finishedMatches.map(match => <StandardMatchCard key={match._id} match={match} />)
                ) : (
                  <EmptyState message="No completed matches yet." />
                )
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* User Stats Card */}
            <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-white/10 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />

              <h3 className="text-xl font-bold text-white mb-1">Your Performance</h3>
              <p className="text-indigo-200 text-xs mb-6 opacity-70">Batting stats across all leagues</p>

              {session ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Runs</span>
                      </div>
                      <span className="text-2xl font-black text-white">
                        {statsLoading ? "---" : (userStats?.totalRuns ?? 0)}
                      </span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Rank</span>
                      </div>
                      <span className="text-2xl font-black text-white">
                        {statsLoading ? "#--" : `#${userStats?.rank ?? "--"}`}
                      </span>
                    </div>
                  </div>

                  <Link href="/profile/stats" className="block w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white text-center uppercase tracking-widest transition-all">
                    View Detailed Analysis
                  </Link>
                </>
              ) : (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Zap className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 leading-relaxed">Login to view your total runs and global ranking</p>
                  <Link href="/login" className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all">
                    Sign In
                  </Link>
                </div>
              )}
            </div>

            {/* Mini Leaderboard */}
            <div className="rounded-3xl p-6 bg-slate-900/50 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Players</h3>
                {session && <Link href="/leaderboard" className="text-xs text-indigo-400 hover:text-indigo-300">View All</Link>}
              </div>

              {session ? (
                <div className="space-y-3">
                  {statsLoading ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-white/5">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-800 text-slate-600 text-[10px]">
                          {i}
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-20 bg-slate-800 rounded-full animate-pulse" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">---</span>
                      </div>
                    ))
                  ) : topPlayers.length > 0 ? (
                    topPlayers.map((player, idx) => (
                      <div key={player.userId._id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 hover:border-indigo-500/30 transition-colors">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' :
                          idx === 1 ? 'bg-slate-300 text-black' :
                            'bg-orange-700 text-white'
                          }`}>
                          {idx + 1}
                        </div>
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800">
                          {player.userId.image ? (
                            <img src={player.userId.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-500">
                              {player.userId.name?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <span className="text-xs font-bold text-white truncate block w-24">{player.userId.name}</span>
                        </div>
                        <span className="text-xs font-black text-indigo-400">{player.totalRuns}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-600 font-bold uppercase tracking-widest">
                      No data yet
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-950/50 rounded-2xl border border-white/5">
                  <Trophy className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-loose px-4">The global leaderboard is high stakes. Log in to see who's dominating the arena.</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// --- Components ---

function HeroMatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished' ||
    match.status === 'completed' ||
    match.status === 'result' ||
    match.status === 'settled';
  const date = new Date(match.startTime);

  return (
    <Link href={`/matches/${match._id}`} className="group relative block w-full h-[280px] rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.01]">
      {/* Background Image / Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

      {/* Live/Status Indicator Bar */}
      {isLive && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)] z-20" />}
      {isFinished && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 z-20" />}

      <div className="relative z-10 h-full flex flex-col justify-between p-8">
        {/* Top Row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
            {isLive ? (
              <span className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                Live Now
              </span>
            ) : isFinished ? (
              <span className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Completed
              </span>
            ) : (
              <span className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3 h-3" />
                Today
              </span>
            )}
            <span className="w-px h-3 bg-white/20" />
            <span className="text-slate-400 text-xs font-medium">{match.venue.split(',')[0]}</span>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between px-4">
          <div className="text-center group-hover:-translate-x-2 transition-transform duration-500">
            <h3 className="text-5xl font-black text-white mb-2">{match.teams[0].shortName}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{match.teams[0].name}</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur shadow-xl mb-2">
              <span className="text-slate-500 font-bold text-xs">VS</span>
            </div>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-full border border-indigo-500/20">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="text-center group-hover:translate-x-2 transition-transform duration-500">
            <h3 className="text-5xl font-black text-white mb-2">{match.teams[1].shortName}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{match.teams[1].name}</p>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
            Enter Match Center <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function StandardMatchCard({ match }: { match: Match }) {
  const date = new Date(match.startTime);
  const isFinished = match.status === 'finished' ||
    match.status === 'completed' ||
    match.status === 'result' ||
    match.status === 'settled';

  return (
    <Link href={`/matches/${match._id}`} className="group flex items-center justify-between p-6 bg-slate-900/50 border border-white/5 rounded-2xl hover:bg-slate-800/50 hover:border-indigo-500/30 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-900/10">
      {/* Left: Time & Venue */}
      <div className="flex flex-col gap-1 min-w-[100px]">
        <span className={`text-xs font-bold uppercase tracking-wider ${isFinished ? 'text-slate-500' : 'text-indigo-400'}`}>
          {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
        </span>
        <span className="text-sm font-medium text-slate-300">
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{match.venue.split(',')[0]}</span>
      </div>

      {/* Middle: Teams */}
      <div className="flex-1 flex items-center justify-center gap-8">
        <div className="text-right w-24">
          <span className="text-lg font-black text-white block">{match.teams[0].shortName}</span>
        </div>
        <span className="text-xs text-slate-600 font-bold">VS</span>
        <div className="text-left w-24">
          <span className="text-lg font-black text-white block">{match.teams[1].shortName}</span>
        </div>
      </div>

      {/* Right: Status / Action */}
      <div className="min-w-[100px] flex justify-end">
        {isFinished ? (
          <span className="px-4 py-1.5 bg-slate-900 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-500/80 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            Completed
          </span>
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
      <Calendar className="w-12 h-12 text-slate-600 mb-4" />
      <p className="text-slate-400 font-medium">{message}</p>
    </div>
  );
}
