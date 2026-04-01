"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Trophy, 
  LayoutDashboard, 
  RefreshCcw,
  IndianRupee,
  Zap,
  ArrowRight
} from "lucide-react";
import { UserContextSwitcher } from "@/components/UserContextSwitcher";
import { AddFundsDialog } from "@/components/AddFundsDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { Spinner } from "@/components/ui/Spinner";
import { ArenaSelectionDialog } from "@/components/ArenaSelectionDialog";
import { PlayerStatsHeader } from "@/components/dashboard/PlayerStatsHeader";
import { MatchHeroSection } from "@/components/dashboard/MatchHeroSection";
import { MatchListTabs } from "@/components/dashboard/MatchListTabs";
import { HallOfFameSection } from "@/components/dashboard/HallOfFameSection";
import { WeeklyReportCard } from "@/components/dashboard/WeeklyReportCard";
import { useToast } from "@/contexts/ToastContext";
import { useTournament } from "@/contexts/TournamentContext";

interface Match {
  _id: string;
  teams: { name: string; shortName: string }[];
  status: string;
  startTime: string;
  venue: string;
}

export default function UserMatchesPage() {
  const { showToast } = useToast();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPlayerView = searchParams.get("view") === "player";
  const { tournamentId, setTournamentId } = useTournament();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Stats States
  const [userStats, setUserStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState<any[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);

  // Wallet States
  const [walletData, setWalletData] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Dialog States
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [selectedMatchForArena, setSelectedMatchForArena] = useState<Match | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && !isPlayerView) {
      const role = (session?.user as any)?.role;
      if (role === "admin") {
        router.push("/admin");
        return;
      } else if (role === "subadmin") {
        router.push("/subadmin");
        return;
      }
    }

    // Initial fetch once authenticated
    if (status === "authenticated") {
      handleRefresh(true);
    }
  }, [status, session, isPlayerView, tournamentId]);

  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    await Promise.all([
      fetchMatches(silent),
      fetchDashboardStats(silent),
      fetchWeeklyReports(silent),
      fetchWalletData(silent)
    ]);
    if (!silent) setRefreshing(false);
    setIsInitializing(false);
  };

  const fetchDashboardStats = async (silent = false) => {
    try {
      if (!silent) setStatsLoading(true);
      const res = await fetch(`/api/user/stats?tournamentId=${tournamentId}`);
      const data = await res.json();
      if (res.ok) setUserStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setStatsLoading(false);
    }
  };

  const fetchWeeklyReports = async (silent = false) => {
    try {
      if (!silent) setWeeklyLoading(true);
      const res = await fetch("/api/user/weekly-report");
      const data = await res.json();
      if (res.ok) setWeeklyReports(data.weeks);
    } catch (err) {
      console.error("Failed to fetch weekly reports", err);
    } finally {
      if (!silent) setWeeklyLoading(false);
    }
  };

  const fetchWalletData = async (silent = false) => {
    try {
      if (!silent) setWalletLoading(true);
      const res = await fetch("/api/user/wallet");
      const data = await res.json();
      if (res.ok) setWalletData(data);
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
    } finally {
      if (!silent) setWalletLoading(false);
    }
  };

  const handleAddFunds = async (amount: number) => {
    try {
      const res = await fetch("/api/user/wallet/add", {
        method: "POST",
        body: JSON.stringify({ amount, description: "Wallet Recharge" })
      });
      if (res.ok) {
        showToast("Funds added successfully!", "success");
        fetchWalletData();
      } else {
        showToast("Failed to add funds.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error adding funds.", "error");
    }
  };

  const fetchMatches = async (silent = true) => {
    try {
      if (!silent) setLoading(true);
      const headers: any = {};
      if (silent) headers['x-silent-fetch'] = 'true';

      const res = await fetch(`/api/matches?tournamentId=${tournamentId}`, { headers });
      const data = await res.json();
      if (res.ok) setMatches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchClick = (match: Match) => {
    setSelectedMatchForArena(match);
  };

  // --- Logic for Sections ---
  const today = new Date().toDateString();

  const heroMatches = matches.filter(m => {
    const isLive = m.status === 'live';
    const isToday = new Date(m.startTime).toDateString() === today;
    return isLive || isToday;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const upcomingMatches = matches.filter(m => {
    const isFuture = m.status === 'upcoming';
    const isToday = new Date(m.startTime).toDateString() === today;
    return isFuture && !isToday;
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).slice(0, 5);

  const finishedMatches = matches.filter(m =>
    ['finished', 'completed', 'result', 'settled'].includes(m.status)
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#050B14] relative overflow-x-hidden">
      {/* Ambient Backlights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header / Nav */}
      <header className="sticky top-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Trophy className="w-5 h-5 md:w-8 md:h-8 text-indigo-500 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm md:text-xl font-black text-white tracking-tight leading-none uppercase italic">WORLD CUP <span className="text-indigo-500">HUB</span></h1>
              <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden xs:block mt-1">Official Player Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {session?.user && (session.user as any).role === "admin" && (
              <Link
                href="/admin"
                className="hidden lg:flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-colors border border-white/5 shadow-lg shadow-black/20"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Control Row (League Selection & Refresh) */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 pt-6">
        <div className="flex items-stretch gap-1.5 max-w-md mx-auto min-w-0">
          <div className="flex-[4] min-w-0">
            <UserContextSwitcher onSelect={(id) => setTournamentId(id || "")} />
          </div>
          <button
            onClick={() => handleRefresh(false)}
            disabled={refreshing}
            className={`flex-[1] max-w-[48px] md:max-w-[56px] flex items-center justify-center rounded-2xl bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all shadow-xl backdrop-blur-sm group ${refreshing ? 'cursor-not-allowed' : ''}`}
            title="Refresh Data"
          >
            <RefreshCcw className={`w-3.5 h-3.5 md:w-5 md:h-5 ${refreshing ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          </button>
        </div>
      </div>

      {/* Modals placed outside header */}
      <AddFundsDialog 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
        onAdd={handleAddFunds} 
      />
      <WithdrawDialog 
        isOpen={isWithdrawModalOpen} 
        onClose={() => setIsWithdrawModalOpen(false)} 
        onSuccess={fetchWalletData} 
        balance={walletData?.balance || 0} 
      />

      {isInitializing ? (
        <div className="flex h-[60vh] items-center justify-center">
            <Spinner />
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 pt-6 pb-20 space-y-8 md:space-y-12">
          {/* 1. TOP BAR: User Performance Summary */}
          {session && (
            <PlayerStatsHeader 
                stats={userStats} 
                loading={statsLoading} 
                tournamentId={tournamentId || ""} 
            />
          )}

          {/* 1.5 WEEKLY REPORT CARD */}
          {session && (
            <WeeklyReportCard weeks={weeklyReports} loading={weeklyLoading} />
          )}

          {/* 2. CENTER: Matchday Action (Hero) */}
          <MatchHeroSection 
            matches={heroMatches} 
            onMatchClick={handleMatchClick} 
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* 3. TABS: Upcoming & Finished */}
            <MatchListTabs 
                upcomingMatches={upcomingMatches} 
                finishedMatches={finishedMatches} 
                onMatchClick={handleMatchClick} 
            />

            {/* Sidebar */}
            <aside className="lg:col-span-4 space-y-8">
                {/* User Profile Summary */}
                <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-indigo-500/20 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-all">
                    {session?.user?.image ? (
                        <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <Trophy className="w-6 h-6 text-indigo-400" />
                    )}
                    </div>
                    <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{session?.user?.name || "Player"}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mt-1">Active Status</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link href="/wallet" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group/item">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover/item:bg-emerald-500/20 transition-all">
                        <IndianRupee className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Balance</span>
                    </div>
                    <span className="text-sm font-black text-white italic">₹{walletData?.balance || 0}</span>
                    </Link>

                    <Link href="/profile/stats" className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all group/item">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover/item:bg-purple-500/20 transition-all">
                        <Zap className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rank</span>
                    </div>
                    <span className="text-sm font-black text-white italic">#{userStats?.rank || "---"}</span>
                    </Link>
                </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setIsWalletModalOpen(true)}
                        className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all group"
                    >
                        <IndianRupee className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Add Funds</span>
                    </button>
                    <button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="flex flex-col items-center justify-center p-6 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-amber-500/30 transition-all group"
                    >
                        <RefreshCcw className="w-6 h-6 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Withdraw</span>
                    </button>
                </div>
            </aside>
          </div>

          {/* Match Winners Section */}
          <HallOfFameSection />
        </main>
      )}

      {/* Modals & Dialogs */}
      {selectedMatchForArena && (
        <ArenaSelectionDialog
          isOpen={!!selectedMatchForArena}
          onClose={() => setSelectedMatchForArena(null)}
          matchId={selectedMatchForArena._id}
          matchName={`${selectedMatchForArena.teams[0].shortName} vs ${selectedMatchForArena.teams[1].shortName}`}
          onJoinSuccess={() => handleRefresh(true)}
        />
      )}
    </div>
  );
}
