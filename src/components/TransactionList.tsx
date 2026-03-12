"use client";

import React from "react";
import { ArrowUpRight, ArrowDownLeft, Receipt, Clock, CheckCircle2, XCircle, AlertCircle, Trophy } from "lucide-react";

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  source?: 'wallet' | 'match';
}

interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
}

export function TransactionList({ transactions, loading }: TransactionListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-950/20 rounded-3xl border border-dashed border-white/10">
        <Receipt className="w-12 h-12 text-slate-700 mb-4" />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">No Transactions Found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.03]">
      {transactions.map((tx) => {
        const isCredit = tx.amount > 0;
        const isMatch = tx.source === 'match';
        const isWithdrawal = tx.type === 'withdrawal';
        const isRefund = tx.type === 'refund';

        return (
          <div
            key={tx._id}
            className="group flex items-center gap-4 py-5 first:pt-0 last:pb-0 transition-all"
          >
            {/* Left: Professional Icon Set */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 bg-slate-900/50 ${
                isMatch 
                  ? "border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/10" 
                  : isWithdrawal
                    ? "border-amber-500/20 text-amber-500 group-hover:bg-amber-500/10"
                    : isRefund
                      ? "border-blue-500/20 text-blue-400 group-hover:bg-blue-500/10"
                      : isCredit
                        ? "border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/10"
                        : "border-rose-500/20 text-rose-400 group-hover:bg-rose-500/10"
              } transition-colors duration-300`}
            >
              {isMatch ? (
                <Trophy className="w-5 h-5" />
              ) : isWithdrawal ? (
                <ArrowDownLeft className="w-5 h-5 rotate-180" />
              ) : isRefund ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isCredit ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <ArrowDownLeft className="w-5 h-5" />
              )}
            </div>

            {/* Middle: Clean Typography */}
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors truncate mb-0.5">
                {tx.description}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {new Date(tx.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                </span>
                <div className="w-1 h-1 rounded-full bg-slate-800" />
                <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isMatch ? 'text-indigo-500/80' : 'text-slate-600'}`}>
                  {tx.type}
                </span>
              </div>
            </div>

            {/* Right: Amount & Status */}
            <div className="flex flex-col items-end gap-2 shrink-0 self-center">
              <div
                className={`text-base font-black tracking-tight leading-none ${
                    isCredit ? "text-emerald-400" : "text-slate-100"
                }`}
              >
                {isCredit ? "+" : ""}{tx.amount.toLocaleString()}
              </div>
              
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[7px] font-black uppercase tracking-[0.1em] ${
                tx.status === "completed" ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-500" :
                tx.status === "failed" ? "bg-rose-500/5 border-rose-500/10 text-rose-500" :
                "bg-amber-500/5 border-amber-500/10 text-amber-500"
              }`}>
                <div className={`w-1 h-1 rounded-full shadow-[0_0_8px] ${
                  tx.status === "completed" ? "bg-emerald-500 shadow-emerald-500/50" :
                  tx.status === "failed" ? "bg-rose-400 shadow-rose-500/50" :
                  "bg-amber-400 shadow-amber-500/50"
                }`} />
                {tx.status}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
