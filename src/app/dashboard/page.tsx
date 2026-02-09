
"use client";

import { useEffect, useState } from "react";
import { Calendar, MapPin, Search, Trophy, ChevronRight, Clock, Battery, Signal, Wifi, Activity, ArrowRight, TrendingUp, LayoutDashboard, Zap, RefreshCcw } from "lucide-react";
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

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial fetch from DB (fast, no scrape)
    fetchMatches(false);
    fetchDashboardStats(false);
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      // Trigger the background sync (loud)
      await fetch("/api/matches/sync", {
        method: "POST"
      });

      // Fetch updated data
      await Promise.all([
        fetchMatches(true), // passing true forces loading state on match list if needed, or keeps it silent
        fetchDashboardStats(false)
      ]);
    } catch (err) {
      console.error("Manual sync failed", err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDashboardStats = async (silent = false) => {
    try {
      if (!silent) setStatsLoading(true);

      const headers: any = {};
      if (silent) headers['x-silent-fetch'] = 'true';

      const [statsRes, leaderboardRes] = await Promise.all([
        fetch("/api/user/stats", { headers }),
        fetch("/api/leaderboard?limit=3", { headers })
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
      if (!silent) setStatsLoading(false);
    }
  };

  const fetchMatches = async (silent = true) => {
    try {
      if (!silent) setLoading(true);
      const headers: any = {};
      if (silent) headers['x-silent-fetch'] = 'true';

      const res = await fetch("/api/matches", { headers });
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

  // 2. Upcoming (Limit to top 5 for dashboard)
  const upcomingMatches = matches.filter(m => {
    const isFuture = m.status === 'upcoming';
    const isToday = new Date(m.startTime).toDateString() === today;
    return isFuture && !isToday;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5); // Ascending

  // 3. Finished (Limit to top 5 for dashboard)
  const finishedMatches = matches.filter(m =>
    m.status === 'finished' ||
    m.status === 'completed' ||
    m.status === 'result' ||
    m.status === 'settled'
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5); // Descending

  return (
    <div className="min-h-screen bg-[#050B14] pb-20 relative overflow-x-hidden">
      {/* Ambient Backlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Nav */}
      <header className="sticky top-0 z-40 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-3 items-center">
          <div className="flex items-center gap-2 md:gap-3 justify-self-start">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-indigo-500" />
            <div>
              <h1 className="text-lg md:text-xl font-black text-white tracking-tight leading-none">WORLD CUP <span className="text-indigo-500">HUB</span></h1>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden sm:block">Official Player Portal</p>
            </div>
          </div>

          <div className="justify-self-center">
            {session?.user && (session.user as any).role === "admin" && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/5 shadow-lg shadow-black/20"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4 justify-self-end">
            {session?.user ? (
              <>
                <div className="flex items-center gap-4">
                  {/* Refresh Button */}
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-2 rounded-full bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all ${refreshing ? 'animate-spin text-indigo-500' : ''}`}
                    title="Refresh Data"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>

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
                        {/* @ts-ignore */}
                        {(session.user as any).image ? (
                          <img src={(session.user as any).image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-bold text-white text-sm">{(session.user.name || "U")?.[0]}</span>
                        )}
                      </div>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-8 space-y-12">

        {/* HERO: Today's / Live Matches */}
        {heroMatches.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
                <span className="w-1.5 h-6 md:w-2 md:h-8 bg-indigo-500 rounded-full" />
                Matchday Action
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] md:text-[10px] font-bold uppercase border border-red-500/20 animate-pulse">
                  Live Updates
                </span>
              </h2>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] md:text-xs text-slate-500 font-medium whitespace-nowrap">Scroll for more</span>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-slate-500" />
              </div>
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
            <div className="flex items-center gap-4 md:gap-8 mb-8 border-b border-white/10 pb-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`pb-3 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'upcoming' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Upcoming Fixtures
                {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`pb-3 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === 'finished' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Past Results
                {activeTab === 'finished' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
              </button>
            </div>

            {/* Content - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {activeTab === 'upcoming' ? (
                upcomingMatches.length > 0 ? (
                  upcomingMatches.map(match => <StandardMatchCard key={match._id} match={match} />)
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState message="No upcoming matches scheduled." />
                  </div>
                )
              ) : (
                finishedMatches.length > 0 ? (
                  finishedMatches.map(match => <StandardMatchCard key={match._id} match={match} />)
                ) : (
                  <div className="md:col-span-2">
                    <EmptyState message="No completed matches yet." />
                  </div>
                )
              )}
            </div>

            {/* View All Button */}
            <Link
              href="/matches"
              className="group flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all text-sm font-bold text-slate-400 hover:text-white uppercase tracking-widest"
            >
              <Calendar className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
              {activeTab === 'upcoming' ? "View Full Schedule" : "View All Results"}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* User Stats Card */}
            <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 border border-white/10 shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />

              <h3 className="text-lg md:text-xl font-bold text-white mb-1">Your Performance</h3>
              <p className="text-indigo-200 text-[10px] md:text-xs mb-6 opacity-70">Batting stats across all leagues</p>

              {session ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-3 h-3 md:w-4 md:h-4 text-indigo-400" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Runs</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-white">
                        {statsLoading ? "---" : (userStats?.totalRuns ?? 0)}
                      </span>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 md:p-4 border border-white/5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-400" />
                        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase">Rank</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black text-white">
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
    <Link href={`/matches/${match._id}`} className="group relative block w-full h-[240px] md:h-[300px] rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-indigo-500/10">
      {/* Background with Gradient & Mesh */}
      <div className="absolute inset-0 bg-[#050B14]" />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-purple-600/20 opacity-60 group-hover:opacity-80 transition-opacity" />
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

      <div className="relative z-10 h-full flex flex-col items-center justify-between p-6 md:p-10">
        {/* Compact Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
            {isLive ? (
              <span className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                Live
              </span>
            ) : isFinished ? (
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Finished
              </span>
            ) : (
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Upcoming
              </span>
            )}
            <span className="w-px h-3 bg-white/10" />
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{match.venue.split(',')[0]}</span>
          </div>
        </div>

        {/* Teams Layout */}
        <div className="w-full flex items-center justify-center gap-4 sm:gap-8 md:gap-16">
          {/* Team 1 */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
              {match.teams[0].shortName}
            </h3>
            <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 md:mt-3 truncate w-full text-center px-2">
              {match.teams[0].name}
            </p>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md shadow-2xl relative z-10">
                <span className="text-slate-400 italic font-black text-[10px] md:text-sm">VS</span>
              </div>
            </div>
            {!isLive && !isFinished && (
              <span className="mt-3 px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[8px] md:text-[9px] font-black rounded-full border border-indigo-500/20 uppercase tracking-widest whitespace-nowrap">
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <h3 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
              {match.teams[1].shortName}
            </h3>
            <p className="text-[8px] md:text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 md:mt-3 truncate w-full text-center px-2">
              {match.teams[1].name}
            </p>
          </div>
        </div>

        {/* View Indicator */}
        <div className="flex flex-col items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
          <span className="text-[8px] md:text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity">Match Center</span>
          <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
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
  const isLive = match.status === 'live';

  return (
    <Link href={`/matches/${match._id}`} className="group relative flex flex-col p-5 bg-slate-900/40 border border-white/5 rounded-3xl hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-500 overflow-hidden shadow-lg h-full">
      {/* Background Glow */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

      {/* Top Section: Status & Time */}
      <div className="flex justify-between items-center mb-6">
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${isLive ? 'bg-red-500/10 border-red-500/20 text-red-500' :
          isFinished ? 'bg-slate-800 border-white/5 text-slate-500' :
            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
          }`}>
          {isLive ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Live
            </span>
          ) : isFinished ? 'Completed' : 'Upcoming'}
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {date.toLocaleDateString([], { month: 'short', day: 'numeric' })} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Middle Section: Teams Grid */}
      <div className="flex items-center justify-between gap-2 mb-6 px-1 md:px-2">
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors shadow-inner">
            <span className="text-base md:text-xl font-black text-white">{match.teams[0].shortName}</span>
          </div>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full">{match.teams[0].name}</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-[9px] md:text-[10px] font-black text-slate-600 mb-1">VS</div>
          <div className="w-px h-6 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
        </div>

        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/30 transition-colors shadow-inner">
            <span className="text-base md:text-xl font-black text-white">{match.teams[1].shortName}</span>
          </div>
          <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight text-center truncate w-full">{match.teams[1].name}</span>
        </div>
      </div>

      {/* Bottom Section: Venue */}
      <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-slate-600" />
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate max-w-[140px]">
            {match.venue.split(',')[0]}
          </span>
        </div>
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-600 transition-all">
          <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-white" />
        </div>
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
