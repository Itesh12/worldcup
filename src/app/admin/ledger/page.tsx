"use client";

import React, { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  LayoutDashboard,
  Wallet,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface PaginationInfo {
    total: number;
    pages: number;
    current: number;
    limit: number;
}

export default function MasterLedgerPage() {
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "commission" | "withdrawal" | "deposit" | "winnings" | "refund">("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);

    const fetchLedger = async (currentPage = 1, currentFilter = "all") => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/ledger?page=${currentPage}&limit=50&type=${currentFilter}`);
            const data = await res.json();
            if (res.ok) {
                setTransactions(data.data || []);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch ledger", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLedger(page, filter);
    }, [page, filter]);

    return (
        <div className="min-h-screen bg-[#020817] text-slate-200 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-[#020817]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Title & Back button */}
                        <div className="flex items-center gap-6">
                            <Link 
                                href={isPlayerView ? "/dashboard?view=player" : "/admin"}
                                className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
                                        <BookOpen className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <h1 className="text-xl font-black text-white uppercase tracking-tight">Master Ledger</h1>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Platform Financial Trails</p>
                            </div>
                        </div>

                        {/* Top Stats */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-400/20 to-emerald-600/0 animate-pulse"></div>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Records</p>
                                    <p className="text-xs font-black text-white">{pagination?.total?.toLocaleString() || "0"}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => fetchLedger(page, filter)}
                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all group"
                            >
                                <RefreshCw className={`w-4 h-4 text-slate-400 group-hover:text-white ${loading ? 'animate-spin text-white' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Advanced Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex gap-2 w-full overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                        {(["all", "commission", "withdrawal", "deposit", "winnings", "refund"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setPage(1); }}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                                    filter === f 
                                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]' 
                                        : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ledger Table Container */}
                <div className="rounded-3xl bg-[#030B1C]/50 border border-white/5 overflow-hidden backdrop-blur-xl shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="bg-white/5 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Details</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-[10px]">
                                {loading && transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                                            <p className="mt-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compiling Records...</p>
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                                                <Database className="w-6 h-6 text-slate-600" />
                                            </div>
                                            <p className="text-base font-black text-white">No Transcations Built</p>
                                            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">The ledger is silent for this filter.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx, i) => (
                                        <tr key={tx._id} className="hover:bg-white/5 transition-all group/row">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-black text-white uppercase tracking-tight">{new Date(tx.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest font-mono mt-0.5">{new Date(tx.createdAt).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xl">
                                                <div className="font-black text-slate-100 text-[10.5px] uppercase tracking-tight break-words leading-relaxed">
                                                    {tx.description || tx.type}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1.5 opacity-70">
                                                    <div className="w-4 h-4 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[8px] font-black border border-indigo-500/30">
                                                        {(tx.sourceUser || tx.userId?.name)?.[0] || "?"}
                                                    </div>
                                                    <span className="font-bold text-[8.5px] text-slate-400 uppercase tracking-widest">
                                                        {tx.sourceUser ? `Source: ${tx.sourceUser}` : (tx.userId?.name || "System")}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono">
                                                <span className={`font-black text-sm border-b-2 border-transparent ${
                                                    tx.type === 'withdrawal' ? 'text-amber-400' :
                                                    tx.type === 'deposit' ? 'text-emerald-400' : 
                                                    tx.type === 'winnings' ? 'text-blue-400' : 'text-slate-300'
                                                }`}>
                                                    {tx.type === 'withdrawal' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shadow-sm ${
                                                    tx.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                    tx.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                    'bg-red-500/10 border-red-500/20 text-red-400'
                                                }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {pagination && pagination.pages > 1 && (
                        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-black/20">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all flex items-center gap-2"
                            >
                                <ChevronLeft className="w-3 h-3" /> Previous
                            </button>

                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page</span>
                                <span className="w-6 h-6 flex items-center justify-center rounded bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-black border border-indigo-500/30">
                                    {page}
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">of {pagination.pages}</span>
                            </div>

                            <button 
                                disabled={page >= pagination.pages}
                                onClick={() => setPage(page + 1)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 border border-white/10 text-white text-[10px] font-black tracking-widest uppercase rounded-xl transition-all flex items-center gap-2"
                            >
                                Next <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

const Database = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
)
