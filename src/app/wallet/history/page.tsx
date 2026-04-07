"use client";

import React, { useEffect, useState } from 'react';
import { 
    History, 
    ArrowUpRight, 
    ArrowDownLeft, 
    Wallet, 
    Search, 
    Filter, 
    Calendar,
    RefreshCcw,
    CheckCircle2,
    Clock,
    AlertCircle,
    Trophy,
    Zap,
    Building2,
    ChevronLeft
} from 'lucide-react';
import { DashboardLayoutWrapper } from '@/components/dashboard/DashboardLayoutWrapper';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/contexts/ToastContext';
import { Spinner } from '@/components/ui/Spinner';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Transaction {
    _id: string;
    amount: number;
    type: 'deposit' | 'withdrawal' | 'entry_fee' | 'winnings' | 'commission' | 'refund';
    status: 'pending' | 'completed' | 'failed';
    description: string;
    createdAt: string;
    referenceId?: string;
}

export default function TransactionHistoryPage() {
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const { showToast } = useToast();

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/user/wallet/transactions');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            showToast("Failed to sync ledger", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             tx.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || tx.type === typeFilter;
        return matchesSearch && matchesType;
    });

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'deposit': return <ArrowDownLeft className="text-emerald-400" />;
            case 'withdrawal': return <ArrowUpRight className="text-red-400" />;
            case 'entry_fee': return <Zap className="text-indigo-400" />;
            case 'winnings': return <Trophy className="text-amber-400" />;
            case 'commission': return <Building2 className="text-purple-400" />;
            case 'refund': return <RefreshCcw className="text-blue-400" />;
            default: return <Wallet className="text-slate-400" />;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            case 'pending': return <Clock className="w-3.5 h-3.5 text-amber-500" />;
            case 'failed': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
            default: return null;
        }
    };

    return (
        <DashboardLayoutWrapper>
            <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-700">
                {/* Breadcrumb & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <Link href={`/dashboard${isPlayerView ? "?view=player" : ""}`} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-4 group w-fit">
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Back to Hub</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-600/10">
                                <History className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">
                                    TRANSACTION <span className="text-indigo-500">LEDGER</span>
                                </h1>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-1 italic">Transparent Financial Activity</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={fetchTransactions}
                            className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-95"
                        >
                            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-4 rounded-3xl border border-white/5">
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                            type="text"
                            placeholder="SEARCH BY DESCRIPTION OR TYPE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border border-white/5 rounded-2xl pl-11 pr-6 py-3 text-[10px] font-black text-white uppercase tracking-widest focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {['all', 'deposit', 'entry_fee', 'winnings', 'commission', 'refund'].map(type => (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
                                    typeFilter === type 
                                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400' 
                                    : 'bg-white/5 border-transparent text-slate-500 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {type.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ledger Content */}
                <div className="bg-[#0A0F1C] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Activity / ID</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Executed At</th>
                                    <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Magnitude</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center">
                                            <Spinner />
                                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-4">Syncing Ledger Threads...</p>
                                        </td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <History className="w-12 h-12 text-slate-800" />
                                                <p className="text-sm font-black text-slate-600 uppercase tracking-[0.2em]">No Record Found in this Stream</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx._id} className="group hover:bg-white/[0.01] transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        {getTypeIcon(tx.type)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-white uppercase italic tracking-tight">{tx.description}</p>
                                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Hash: {tx._id.slice(-12)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border w-fit ${
                                                    tx.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    tx.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                    'bg-red-500/10 border-red-500/20 text-red-500'
                                                }`}>
                                                    {getStatusIcon(tx.status)}
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{tx.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase tracking-tight tabular-nums">
                                                        {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className={`text-sm md:text-base font-black italic tabular-nums ${
                                                    ['deposit', 'winnings', 'commission', 'refund'].includes(tx.type) ? 'text-emerald-400' : 'text-slate-200'
                                                }`}>
                                                    {['deposit', 'winnings', 'commission', 'refund'].includes(tx.type) ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ambient Bottom pattern */}
                <div className="flex items-center justify-center py-12 opacity-20">
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white to-transparent" />
                    <History className="w-6 h-6 mx-8 text-white" />
                    <div className="h-px w-24 bg-gradient-to-r from-transparent via-white to-transparent" />
                </div>
            </div>
        </DashboardLayoutWrapper>
    );
}
