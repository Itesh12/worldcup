"use client";

import React, { useEffect, useState } from "react";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ArrowLeft,
  Camera, 
  Save, 
  X, 
  Loader2, 
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Receipt,
  Download,
  IndianRupee,
  Trophy,
  RefreshCcw,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUpload } from "@/components/ImageUpload";
import { updateProfile } from "@/app/actions/profile";
import { TransactionList } from "@/components/TransactionList";
import { AddFundsDialog } from "@/components/AddFundsDialog";
import { WithdrawDialog } from "@/components/WithdrawDialog";
import { PayoutMethodManager } from "@/components/PayoutMethodManager";
import { UserContextSwitcher } from "@/components/UserContextSwitcher";
import { useTournament } from "@/components/TournamentContext";
import { toast, Toaster } from "react-hot-toast";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [walletData, setWalletData] = useState<{ balance: number; transactions: any[] } | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { tournamentId } = useTournament();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        image: session.user.image || "",
      });
      fetchWalletData();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchUserStats();
    }
  }, [session, tournamentId]);

  const fetchWalletData = async () => {
    try {
      setWalletLoading(true);
      const res = await fetch("/api/user/wallet");
      const data = await res.json();
      if (res.ok) setWalletData(data);
    } catch (err) {
      console.error("Failed to fetch wallet data", err);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true);
      const url = tournamentId 
        ? `/api/user/stats?detailed=true&tournamentId=${tournamentId}`
        : `/api/user/stats?detailed=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setUserStats(data);
    } catch (err) {
      console.error("Failed to fetch user stats", err);
    } finally {
      setStatsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchWalletData(), fetchUserStats()]);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await updateProfile({
        name: formData.name,
        image: formData.image
      });

      if (res.success) {
        await update({ name: formData.name, image: formData.image });
        toast.success("Profile updated!");
        setIsEditing(false);
        router.refresh();
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFunds = async (amount: number) => {
    try {
      const res = await fetch("/api/user/wallet/add", {
        method: "POST",
        body: JSON.stringify({ amount, description: "Wallet Recharge" })
      });
      if (res.ok) {
        toast.success("Funds added successfully!");
        fetchWalletData();
        fetchUserStats();
      } else {
        toast.error("Failed to add funds.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error adding funds.");
    }
  };

  // Merge transactions from both wallet and match history
  const unifiedActivity = [
    ...(walletData?.transactions?.map((t: any) => ({ ...t, source: 'wallet' })) || []),
    ...(userStats?.history?.map((h: any) => ({
      _id: h.matchId,
      amount: h.pnl,
      type: 'Match Result',
      description: `Result: ${h.teams}`,
      status: 'completed',
      createdAt: h.date,
      source: 'match'
    })) || [])
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (!session) {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-white selection:bg-indigo-500/30">
      <Toaster position="top-right" />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Standardized Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-6 min-w-0">
                        <Link href="/dashboard" className="shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-lg">
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <Trophy className="shrink-0 w-5 h-5 md:w-6 md:h-6 text-indigo-500" />
                            <h1 className="text-sm md:text-xl font-black text-white tracking-tight italic uppercase truncate">
                                Player <span className="text-indigo-500">Profile</span>
                            </h1>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                        <button
                          onClick={handleRefresh}
                          disabled={refreshing}
                          className={`p-2 md:p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all hover:bg-slate-800 group ${refreshing ? 'cursor-not-allowed opacity-50' : ''} shadow-lg`}
                          title="Refresh Match Data"
                        >
                          <RefreshCcw className={`w-3.5 h-3.5 md:w-4 h-4 ${refreshing ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                        </button>
                    </div>
                </div>
            </header>

      <main className="max-w-7xl mx-auto px-4 py-20 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <section className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-slate-900/40 border border-white/5 shadow-2xl backdrop-blur-md p-6 md:p-10">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-50" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative group mb-6">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 shadow-2xl shadow-indigo-500/20">
                    <div className="w-full h-full rounded-full bg-[#050B14] overflow-hidden flex items-center justify-center">
                      {isEditing ? (
                        <ImageUpload
                          value={formData.image}
                          onChange={(val) => setFormData({ ...formData, image: val })}
                          label=""
                        />
                      ) : (
                          session.user?.image ? (
                            <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-5xl font-black text-white">{session.user?.name?.[0] || 'U'}</span>
                          )
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="absolute bottom-2 right-2 p-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 transition-all active:scale-90 border border-white/10"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="w-full space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Display Name</label>
                      <input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-900 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-all"
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-4 rounded-2xl font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">{session.user?.name}</h1>
                    <span className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                      { (session.user as any)?.role || 'Elite Player' }
                    </span>

                    <div className="w-full space-y-4">
                      <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Email Identity</p>
                          <p className="text-sm font-bold text-white truncate">{session.user?.email}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center justify-center gap-3 p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 hover:border-rose-500/20 text-rose-500 transition-all group"
                      >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Terminate Session</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Wallet & Stats */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Wallet Overview Banner */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative overflow-hidden rounded-[2.5rem] p-8 bg-slate-900 border border-white/5 shadow-2xl">
                {/* Background Decoration */}
                <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none select-none">
                  <IndianRupee className="w-48 h-48 text-white rotate-12" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                        <Wallet className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Liquidity</span>
                    </div>
                    
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                        <span className="text-xl font-black text-indigo-500">₹</span>
                      </div>
                      <span className="text-5xl font-black text-white tracking-tighter">
                        {walletLoading ? "----" : walletData?.balance.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-10 flex gap-4">
                    <button 
                      onClick={() => setIsWalletModalOpen(true)}
                      className="flex-1 py-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-600/10"
                    >
                      Deposit
                    </button>
                    <button 
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-95"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>

              <AddFundsDialog 
                isOpen={isWalletModalOpen} 
                onClose={() => setIsWalletModalOpen(false)} 
                onSuccess={() => {
                  fetchWalletData();
                  fetchUserStats();
                }} 
              />

              <WithdrawDialog
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                onSuccess={() => {
                  fetchWalletData();
                  fetchUserStats();
                }}
                balance={walletData?.balance || 0}
              />

              <div className="rounded-[2.5rem] p-8 bg-slate-900/40 border border-white/5 backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Financial Performance</span>
                  </div>
                  <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    <div className="flex flex-col">
                      <div className="h-6 md:h-8 mb-1">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-wider">Lifetime P&L</p>
                      </div>
                      <p className={`text-lg md:text-2xl font-black leading-none ${ (userStats?.overview?.netWorth || 0) >= 0 ? 'text-emerald-400' : 'text-rose-500' }`}>
                        {statsLoading ? "₹----" : `${(userStats?.overview?.netWorth || 0) >= 0 ? '+' : '-'}₹${Math.abs(userStats?.overview?.netWorth || 0)}`}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="h-6 md:h-8 mb-1">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-wider">Win Ratio</p>
                      </div>
                      <p className="text-lg md:text-2xl font-black text-white leading-none">
                        {statsLoading ? "---%" : `${userStats?.history?.length > 0 ? ((userStats.history.filter((h: any) => h.outcome === 'win').length / userStats.history.length) * 100).toFixed(0) : 0}%`}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="h-6 md:h-8 mb-1">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-wider">Total Runs</p>
                      </div>
                      <p className="text-lg md:text-2xl font-black text-indigo-400 leading-none">
                        {statsLoading ? "----" : (userStats?.overview?.runs || 0)}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <div className="h-6 md:h-8 mb-1">
                        <p className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-wider">Lifetime S/R</p>
                      </div>
                      <p className="text-lg md:text-2xl font-black text-white leading-none">
                        {statsLoading ? "---.--" : (userStats?.overview?.strikeRate || "0.00")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Verified Athlete Stats</span>
                  <Settings className="w-4 h-4 text-slate-600 cursor-pointer hover:text-white transition-colors" />
                </div>
              </div>
            </section>

            {/* Saved Payout Methods */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-md">
              <PayoutMethodManager />
            </div>

            {/* Transaction History Page Version */}
            <section className="rounded-[2rem] md:rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-md overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="p-2.5 md:p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                    <Receipt className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-tight">Ledger <span className="text-amber-500">Activity</span></h3>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Unified Financial Flow</p>
                  </div>
                </div>
                <button className="p-2.5 md:p-3 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all">
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
                <div className="p-4 md:p-8 overflow-x-auto">
                  <TransactionList transactions={unifiedActivity} loading={statsLoading || walletLoading} />
                </div>
            </section>

          </div>
        </div>
      </main>
    </div>
  );
}
