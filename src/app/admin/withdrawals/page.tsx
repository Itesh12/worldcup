"use client";

import React, { useEffect, useState, Suspense } from "react";
import { 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  ChevronRight, 
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  Loader2,
  RefreshCw,
  TrendingUp,
  Wallet,
  Coins,
  ShieldCheck,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { Spinner } from "@/components/ui/Spinner";

function WithdrawalsContent() {
  const searchParams = useSearchParams();
  const isPlayerView = searchParams.get("view") === "player";
  const { showToast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "failed">("pending");
  const [adminNote, setAdminNote] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/withdrawals");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (err) {
      showToast("Failed to load withdrawal requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch("/api/admin/finance/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch finance stats", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchStats();
  }, []);

  const handleProcess = async (transactionId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingId(transactionId);
      const res = await fetch("/api/admin/withdrawals", {
        method: "POST",
        body: JSON.stringify({ transactionId, action, adminNote }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        showToast(`Withdrawal ${action}ed successfully`, "success");
        fetchWithdrawals();
        setAdminNote("");
      } else {
        const error = await res.json();
        showToast(error.error || "Failed to process request", "error");
      }
    } catch (err) {
      showToast("An error occurred", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    filter === "all" ? true : w.status === filter
  );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 relative pb-20">
            {/* Header is now at Layout Level */}

            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10 pt-4">
                    <div className="flex items-center gap-5">
                        <Link 
                            href={isPlayerView ? "/dashboard?view=player" : "/admin"}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 shadow-xl group"
                        >
                            <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Oversight Live</span>
                            </div>
                            <h2 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                                Settlement <span className="bg-gradient-to-r from-amber-400 to-orange-600 bg-clip-text text-transparent">Control Center</span>
                            </h2>
                            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] italic mt-1 opacity-70">
                                Revenue Integrity <span className="text-slate-700 mx-1">/</span> Payout Audit
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { fetchWithdrawals(); fetchStats(); }}
                            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group shrink-0 active:scale-95 shadow-xl flex items-center justify-center"
                        >
                            <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform duration-700 ${loading || statsLoading ? 'animate-spin' : ''}`} />
                        </button>
                        
                        <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1.5 rounded-[1.25rem] border border-white/5 shadow-2xl">
                            {(["all", "pending", "completed", "failed"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/tab ${
                                        filter === f 
                                            ? "text-white" 
                                            : "text-slate-500 hover:text-slate-300"
                                    }`}
                                >
                                    {filter === f && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-700 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-in fade-in zoom-in duration-300" />
                                    )}
                                    <span className="relative z-10">{f}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 relative z-10 w-full mb-10">
                {/* Finance Dashboard Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-6 mb-10">
                    {[
                        { 
                            label: "Total Net Revenue", 
                            value: stats?.totalRevenue || 0, 
                            icon: TrendingUp, 
                            color: "text-emerald-400", 
                            bg: "bg-emerald-500/10", 
                            border: "border-emerald-500/20",
                            tag: "Platform Profit"
                        },
                        { 
                            label: "Player Wallets", 
                            value: stats?.totalUserCash || 0, 
                            icon: Wallet, 
                            color: "text-amber-400", 
                            bg: "bg-amber-500/10", 
                            border: "border-amber-500/20",
                            tag: "Available Cash"
                        },
                        { 
                            label: "Escrow Stakes", 
                            value: stats?.activePrizePool || 0, 
                            icon: ShieldCheck, 
                            color: "text-blue-400", 
                            bg: "bg-blue-500/10", 
                            border: "border-blue-500/20",
                            tag: "Unsettled Prizes"
                        },
                        { 
                            label: "Partner Earnings", 
                            value: stats?.subAdminOwed || 0, 
                            icon: Coins, 
                            color: "text-indigo-400", 
                            bg: "bg-indigo-500/10", 
                            border: "border-indigo-500/20",
                            tag: "Realized Commissions"
                        },
                        { 
                            label: "Pending Payouts", 
                            value: stats?.pendingWithdrawals || 0, 
                            icon: Clock, 
                            color: "text-rose-400", 
                            bg: "bg-rose-500/10", 
                            border: "border-rose-500/20",
                            tag: "Cash Out Requests"
                        }
                    ].map((card, i) => (
                        <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 rounded-3xl p-4 md:p-5 transition-all duration-500 group relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[140px]">
                            {/* Subtle Ambient Glow */}
                            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${card.bg}`} />
                            
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-2xl ${card.bg} ${card.border} border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                                    <card.icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                                <span className={`text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-right truncate ml-2`}>
                                    {card.tag}
                                </span>
                            </div>
                            
                            <div className="space-y-1">
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                                    {card.label}
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-xl md:text-2xl font-black italic tracking-tighter leading-none ${card.color} truncate`}>
                                        ₹{card.value.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                        <IndianRupee className="w-4 h-4 text-slate-500" />
                    </div>
                    <h2 className="text-sm md:text-base font-black text-white uppercase tracking-widest italic">Payout Queue</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Spinner />
                  </div>
                ) : filteredWithdrawals.length === 0 ? (
                  <div className="bg-slate-900/40 border-dashed border border-white/10 rounded-[2.5rem] py-32 text-center shadow-xl">
                    <div className="w-20 h-20 bg-slate-950 rounded-3xl flex items-center justify-center border border-white/5 mx-auto mb-6 shadow-inset">
                      <CheckCircle2 className="w-8 h-8 text-slate-700" />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest mb-2">No Requests Found</h3>
                    <p className="text-slate-500 text-xs">All clear! No items match this category.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredWithdrawals.map(w => (
                        <div key={w._id} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-amber-500/30 rounded-2xl md:rounded-3xl p-5 md:p-6 transition-all duration-300 shadow-xl">
                             {/* Top Row: User & Amount & Status */}
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4 min-w-0">
                                      {/* Avatar */}
                                      <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-slate-400 shrink-0 shadow-inner">
                                          {w.userId?.name?.charAt(0) || '?'}
                                      </div>
                                      <div className="min-w-0">
                                          <h3 className="text-sm md:text-base font-black text-white truncate">{w.userId?.name || "Unknown User"}</h3>
                                          <p className="text-xs text-slate-500 font-medium truncate">{w.userId?.email}</p>
                                          
                                          {/* Desktop Description */}
                                          <div className="hidden md:flex items-center gap-2 mt-1">
                                                <MessageSquare className="w-3 h-3 text-indigo-400 shrink-0" />
                                                <span className="text-[10px] md:text-[11px] text-slate-400 font-medium truncate max-w-sm lg:max-w-md">{w.description}</span>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0">
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest hidden md:inline mt-1">Amount</span>
                                          <span className="text-xl md:text-2xl font-black text-white tracking-tighter italic leading-none">₹{Math.abs(w.amount).toLocaleString()}</span>
                                      </div>
                                      
                                      <div className={`px-2.5 py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-dashed ${
                                        w.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                                        w.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                                        'bg-rose-500/10 text-rose-500 border-rose-500/30'
                                      }`}>
                                        {w.status}
                                      </div>
                                  </div>
                             </div>

                             {/* Mobile Description */}
                             <div className="flex md:hidden items-start gap-2 mt-4 pt-4 border-t border-white/5">
                                 <MessageSquare className="w-3 h-3 text-indigo-400 mt-0.5 shrink-0" />
                                 <span className="text-[11px] text-slate-400 font-medium leading-snug break-words">{w.description}</span>
                             </div>

                             {/* Actions Row (If Pending) */}
                             {w.status === 'pending' && (
                                 <div className="mt-5 pt-5 border-t border-white/5 flex flex-col md:flex-row gap-3">
                                     <input
                                        type="text"
                                        placeholder="Add private note or TXN ID..."
                                        value={processingId === w._id ? adminNote : ""}
                                        onChange={(e) => {
                                          setProcessingId(w._id);
                                          setAdminNote(e.target.value);
                                        }}
                                        className="flex-1 bg-black/40 border border-white/10 focus:border-amber-500/30 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-all"
                                      />
                                      <div className="flex items-center gap-2">
                                          <button
                                            disabled={!!processingId}
                                            onClick={() => handleProcess(w._id, 'approve')}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-all shadow-xl shadow-emerald-900/10"
                                          >
                                            {processingId === w._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate">Approve</span>
                                          </button>
                                          <button
                                            disabled={!!processingId}
                                            onClick={() => handleProcess(w._id, 'reject')}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 disabled:opacity-50 text-rose-400 rounded-xl transition-all"
                                          >
                                            {processingId === w._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate">Reject</span>
                                          </button>
                                      </div>
                                 </div>
                             )}

                             {/* Processed Info */}
                             {w.status !== 'pending' && (
                                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
                                   <div className="flex items-center gap-2">
                                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Actioned on {new Date(w.updatedAt).toLocaleDateString()} at {new Date(w.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                   </div>
                                </div>
                             )}
                        </div>
                    ))}
                  </div>
                )}
            </main>
        </div>
    );
}

export default function WithdrawalsPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#05060f] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">Initializing Financial Grid...</p>
        </div>
    }>
      <WithdrawalsContent />
    </Suspense>
  );
}
