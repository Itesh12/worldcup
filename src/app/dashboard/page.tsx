
"use client";

import React, { useEffect, useState, useRef } from "react";
import { Calendar, MapPin, Search, Trophy, ChevronRight, Clock, Battery, Signal, Wifi, Activity, ArrowRight, TrendingUp, LayoutDashboard, Zap, RefreshCcw, PartyPopper, ChevronLeft, BarChart3, PieChart, Info, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
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
  const [userStats, setUserStats] = useState<{ totalRuns: number; rank: number; netWorth: number } | null>(null);
  const [topPlayers, setTopPlayers] = useState<any[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initial fetch from DB (fast, no scrape)
    fetchMatches(false);
    fetchDashboardStats(false);
    fetchWeeklyReports();
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

  const fetchWeeklyReports = async () => {
    try {
      setWeeklyLoading(true);
      const res = await fetch("/api/user/weekly-report");
      const data = await res.json();
      if (res.ok) setWeeklyReports(data.weeks);
    } catch (err) {
      console.error("Failed to fetch weekly reports", err);
    } finally {
      setWeeklyLoading(false);
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

        {/* 1. TOP BAR: User Performance Summary (New Placement) */}
        {session && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="relative overflow-hidden rounded-[2rem] p-6 md:p-8 bg-gradient-to-r from-indigo-900/40 via-slate-900/40 to-indigo-900/40 border border-white/5 shadow-2xl backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-64 h-full bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight">Your Performance</h3>
                  <p className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest opacity-70">Total Batting stats across all tournaments</p>
                </div>

                <div className="flex items-center gap-6 md:gap-12">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-3 h-3 text-indigo-400" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Runs</span>
                    </div>
                    <span className="text-3xl md:text-4xl font-black text-white">
                      {statsLoading ? "---" : (userStats?.totalRuns ?? 0)}
                    </span>
                  </div>

                  <div className="w-px h-12 bg-white/5 hidden md:block" />

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-3 h-3 text-purple-400" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Global Rank</span>
                    </div>
                    <span className="text-3xl md:text-4xl font-black text-white">
                      {statsLoading ? "#--" : `#${userStats?.rank ?? "--"}`}
                    </span>
                  </div>

                  <div className="w-px h-12 bg-white/5 hidden md:block" />

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Net Worth</span>
                    </div>
                    <span className={`text-3xl md:text-4xl font-black ${userStats && userStats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {statsLoading ? "₹--" : `₹${userStats?.netWorth ?? 0}`}
                    </span>
                  </div>
                </div>

                <Link
                  href="/profile/stats"
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95"
                >
                  View Analysis
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 1.5 WEEKLY REPORT CARD (New Feature) */}
        {session && (
          <WeeklyReportCard weeks={weeklyReports} loading={weeklyLoading} />
        )}

        {/* 2. CENTER: Matchday Action */}
        {heroMatches.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-5 duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
                <span className="w-1.5 h-6 md:w-2 md:h-8 bg-indigo-500 rounded-full" />
                Live <span className="text-indigo-500">Arena</span>
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[8px] font-black uppercase border border-red-500/20 animate-pulse tracking-widest">
                  Live
                </span>
              </h2>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Swipe for more</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </div>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 scrollbar-hide">
              {heroMatches.map((match) => (
                <div key={match._id} className="snap-center shrink-0 w-full md:w-[600px]">
                  <HeroMatchCard match={match} />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            {/* Tabs */}
            <div className="flex items-center gap-8 mb-8 border-b border-white/5 pb-1 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === 'upcoming' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
              >
                Upcoming
                {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
              </button>
              <button
                onClick={() => setActiveTab('finished')}
                className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === 'finished' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
              >
                Past Results
                {activeTab === 'finished' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
              </button>
            </div>

            {/* Content - 2 Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
              className="group flex items-center justify-center gap-3 w-full py-5 rounded-3xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all text-xs font-black text-slate-400 hover:text-white uppercase tracking-[0.2em]"
            >
              <Calendar className="w-4 h-4 text-indigo-500" />
              {activeTab === 'upcoming' ? "Tournament Schedule" : "All Match Results"}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {!session && (
              <div className="relative overflow-hidden rounded-[2rem] p-8 bg-slate-950 border border-white/5 shadow-2xl text-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5">
                  <Zap className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Track Your Stats</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed px-4">Login to view your total runs and global ranking among world class players.</p>
                <Link href="/login" className="block w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                  Join the Arena
                </Link>
              </div>
            )}

            {/* Mini Leaderboard */}
            <div className="rounded-[2rem] p-6 md:p-8 bg-slate-900/40 border border-white/5 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-indigo-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Top Scorchers</h3>
                </div>
                {session && (
                  <Link href="/leaderboard" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest flex items-center gap-1 group">
                    View All
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>

              {session ? (
                <div className="space-y-4">
                  {statsLoading ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/30 border border-white/5">
                        <div className="h-2 w-24 bg-slate-800 rounded-full animate-pulse" />
                      </div>
                    ))
                  ) : topPlayers.length > 0 ? (
                    topPlayers.map((player, idx) => (
                      <div key={player.userId._id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-slate-950/80 group">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-xl text-[10px] font-black ${idx === 0 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' :
                          idx === 1 ? 'bg-slate-300 text-black' :
                            idx === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'
                          }`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-black text-white truncate block group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{player.userId.name}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Player</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-indigo-400 block tracking-tight">{player.totalRuns}</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase">Runs</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">
                      Awaiting Data
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-10 text-center bg-slate-950/30 rounded-2xl border border-white/5">
                  <Trophy className="w-10 h-10 text-slate-800 mx-auto mb-4" />
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-loose px-6 italic">The global leaderboard is reserved for participating players.</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Match Winners Section */}
        <WinnersSection />
      </main>
    </div>
  );
}

function WinnersSection() {
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  const fetchWinners = async () => {
    try {
      const res = await fetch('/api/matches/winners');
      const data = await res.json();
      if (res.ok) setWinners(data);
    } catch (err) {
      console.error("Failed to fetch winners", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || winners.length === 0) return null;

  return (
    <section className="mt-12 md:mt-20 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <PartyPopper className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Hall of <span className="text-indigo-500">Fame</span></h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Match Champions</p>
          </div>
        </div>
        <Link
          href="/hall-of-fame"
          className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center gap-2"
        >
          View All
          <ChevronRight className="w-4 h-4 text-indigo-400" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {winners.map((item, idx) => (
          <div key={idx} className="group relative overflow-hidden bg-slate-900/40 border border-white/5 rounded-[2rem] p-6 hover:border-indigo-500/30 transition-all duration-500 hover:bg-slate-900/60 shadow-lg">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-500" />

            <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{new Date(item.match.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white uppercase">{item.match.teams[0]?.shortName} <span className="text-slate-600">vs</span> {item.match.teams[1]?.shortName}</h3>
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Winner</span>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-500 via-orange-500 to-yellow-600 p-[2px] shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-500">
                <div className="w-full h-full rounded-full bg-[#050B14] flex items-center justify-center overflow-hidden">
                  {item.winner.image ? (
                    <img src={item.winner.image} alt={item.winner.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs font-black text-white">{item.winner.name[0]}</div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-black text-white truncate group-hover:text-indigo-400 transition-colors">{item.winner.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{item.winner.score}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">Runs</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-indigo-400">{item.winner.strikeRate}</span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">S/R</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
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

// --- Weekly Report Card Component ---

function WeeklyReportCard({ weeks, loading }: { weeks: any[], loading: boolean }) {
  const { data: session } = useSession();
  const [currentIndex, setCurrentIndex] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-slate-900/20 rounded-[2rem] border border-white/5 animate-pulse flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Compiling Weekly Insight...</span>
        </div>
      </div>
    );
  }

  if (!weeks || weeks.length === 0) return null;

  const currentWeek = weeks[currentIndex];
  if (!currentWeek) return null;

  const isLatest = currentIndex === 0;
  const isOldest = currentIndex === weeks.length - 1;

  const handlePrev = () => {
    if (!isOldest) setCurrentIndex(prev => prev + 1);
  };
  const handleNext = () => {
    if (!isLatest) setCurrentIndex(prev => prev - 1);
  };

  const handleDownload = async () => {
    if (!fullReportRef.current) return;
    try {
      setDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const dataUrl = await toPng(fullReportRef.current, {
        cacheBust: true,
        backgroundColor: '#050B14',
        width: 1200,
        height: 1600,
      });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (1600 * pdfWidth) / 1200;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`WorldCupHub_Report_${currentWeek.label.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const maxRuns = Math.max(...currentWeek.matches.map((m: any) => m.runs), 1);

  return (
    <section className="relative group/report">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
            <BarChart3 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Weekly <span className="text-amber-500">Pulse</span></h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{currentIndex === 0 ? "Current Week Overview" : "Previous Week Review"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrev}
            disabled={isOldest}
            className={`p-2 rounded-xl border transition-all ${isOldest ? 'opacity-30 border-white/5 text-slate-600' : 'bg-slate-800 border-white/10 text-white hover:bg-slate-700'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="px-4 py-2 bg-slate-900/60 border border-white/5 rounded-xl">
            <span className="text-[10px] font-black text-white uppercase tracking-widest">{currentWeek.label}</span>
          </div>
          <button
            onClick={handleNext}
            disabled={isLatest}
            className={`p-2 rounded-xl border transition-all ${isLatest ? 'opacity-30 border-white/5 text-slate-600' : 'bg-slate-800 border-white/10 text-white hover:bg-slate-700'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-white/5 mx-1" />
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {downloading ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
            {downloading ? "Exporting" : "Download"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          ref={reportRef}
          key={currentWeek.key}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, y: -10 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 bg-slate-900/40 border border-white/5 shadow-2xl backdrop-blur-md"
        >
          {/* Ambient background blur */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left: Summary & Charts */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Performance Score</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Runs</p>
                      <p className="text-2xl font-black text-white">{currentWeek.stats.runs}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Average</p>
                      <p className="text-2xl font-black text-indigo-400">{currentWeek.stats.average}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Financial Flow</h3>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-white/5 shadow-inner">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500">Net Weekly P&L</span>
                      <span className={`text-xl font-black ${currentWeek.stats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentWeek.stats.netWorth >= 0 ? `+₹${currentWeek.stats.netWorth}` : `-₹${Math.abs(currentWeek.stats.netWorth)}`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full ${currentWeek.stats.netWorth >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Win Rate Gauge */}
                <div className="pt-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center justify-between">
                    Win Efficiency
                    <Trophy className="w-3 h-3 text-amber-500" />
                  </h3>
                  <div className="flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <WinRateGauge percentage={parseFloat(currentWeek.stats.wins > 0 ? ((currentWeek.stats.wins / (currentWeek.stats.wins + currentWeek.stats.losses)) * 100).toFixed(0) : "0")} />
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Ledger Breakdown */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <PieChart className="w-3 h-3 text-amber-500" />
                Settlement Ledger
              </h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {currentWeek.ledger.length > 0 ? (
                  currentWeek.ledger.map((item: any) => (
                    <div key={item.userId} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                            {item.name[0]}
                          </div>
                          <span className="text-xs font-bold text-white">{item.name}</span>
                        </div>
                        <span className={`text-xs font-black ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.amount >= 0 ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30">
                    <span className="text-[8px] font-black uppercase tracking-widest">No Transactions This Week</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Match Feed */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <Clock className="w-3 h-3 text-purple-500" />
                Recent Activity
              </h3>
              <div className="space-y-4">
                {currentWeek.matches.slice(0, 4).map((m: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group/item flex items-center gap-4 p-4 bg-slate-950/40 rounded-2xl border border-white/5"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.outcome === 'win' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-black text-white uppercase tracking-tight truncate">{m.venue.split(',')[0]}</span>
                        <span className={`text-[10px] font-bold ${m.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.pnl >= 0 ? `+₹${m.pnl}` : `-₹${Math.abs(m.pnl)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-600 uppercase">Res: {m.runs} ({m.balls})</span>
                        <span className="text-[8px] font-bold text-indigo-400 uppercase">{new Date(m.date).toLocaleDateString([], { weekday: 'short' })}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <Link href="/profile/stats" className="flex items-center justify-center gap-2 w-full py-3 mt-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all text-[9px] font-black text-slate-400 hover:text-white uppercase tracking-widest">
                View Full Analytics
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Hidden Full Template for PDF Export */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <WeeklyReportTemplate ref={fullReportRef} week={currentWeek} userName={session?.user?.name || "Player"} />
      </div>
    </section>
  );
}

// --- Win Rate Gauge Component ---
function WinRateGauge({ percentage }: { percentage: number }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-slate-800"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-indigo-500"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-x-0 top-[35%] text-center">
        <span className="text-xl font-black text-white">{percentage}%</span>
        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Win Rate</p>
      </div>
    </div>
  );
}

// --- Full Page Report Template for PDF ---
const WeeklyReportTemplate = React.forwardRef<HTMLDivElement, { week: any, userName: string }>(({ week, userName }, ref) => {
  return (
    <div ref={ref} className="w-[1200px] p-20 bg-[#050B14] text-white space-y-12 font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-10">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">WorldCupHub <span className="text-amber-500">Report</span></h1>
          <p className="text-xl font-bold text-slate-500 uppercase tracking-widest">Weekly Performance Insight • {week.label}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-indigo-400 uppercase">{userName}</p>
          <p className="text-sm font-bold text-slate-600 uppercase">Pro Stats Analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem]">
          <p className="text-sm font-black text-slate-500 uppercase mb-2">Weekly Batting</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black">{week.stats.runs}</span>
            <span className="text-xl font-bold text-slate-600">Runs</span>
          </div>
          <p className="text-sm text-slate-400 mt-4 font-bold uppercase tracking-wider">Avg: {week.stats.average} • SR: {week.stats.strikeRate}</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem]">
          <p className="text-sm font-black text-slate-500 uppercase mb-2">Financial Flow</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl font-black ${week.stats.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {week.stats.netWorth >= 0 ? `+₹${week.stats.netWorth}` : `-₹${Math.abs(week.stats.netWorth)}`}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-4 font-bold uppercase tracking-wider">{week.stats.netWorth >= 0 ? 'Profit' : 'Loss'} generated this week</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2rem]">
          <p className="text-sm font-black text-slate-500 uppercase mb-2">Success Rate</p>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black">{week.stats.wins}</span>
            <span className="text-xl font-bold text-slate-600">Wins</span>
          </div>
          <p className="text-sm text-slate-400 mt-4 font-bold uppercase tracking-wider">Out of {week.stats.wins + week.stats.losses} money matches</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12">
        <section>
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-500 mb-6">Settlement Ledger</h2>
          <div className="space-y-4">
            {week.ledger.map((item: any) => (
              <div key={item.userId} className="p-6 bg-white/5 rounded-3xl flex items-center justify-between">
                <span className="text-xl font-bold">{item.name}</span>
                <span className={`text-2xl font-black ${item.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.amount >= 0 ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-500 mb-6">Match Feed</h2>
          <div className="space-y-4">
            {week.matches.map((m: any, i: number) => (
              <div key={i} className="p-6 bg-slate-900/60 rounded-3xl border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-black uppercase">{m.venue.split(',')[0]}</span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${m.outcome === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>{m.outcome}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-widest">
                  <span>{m.runs} Runs ({m.balls} Balls)</span>
                  <span>{new Date(m.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="pt-20 border-t border-white/10 text-center opacity-30">
        <p className="text-[12px] font-black uppercase tracking-[0.5em]">Auto-Generated by WorldCupHub Intelligence System</p>
      </div>
    </div>
  );
});
WeeklyReportTemplate.displayName = "WeeklyReportTemplate";
