"use client";

import React from "react";
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Landmark } from "lucide-react";
import { motion } from "framer-motion";

interface WalletCardProps {
  balance: number;
  onAddFunds?: () => void;
  onWithdraw?: () => void;
  loading?: boolean;
}

export function WalletCard({ balance, onAddFunds, onWithdraw, loading }: WalletCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] p-6 bg-gradient-to-br from-indigo-900/40 via-slate-900/40 to-indigo-900/40 border border-white/5 shadow-2xl backdrop-blur-sm">
      {/* Subtle Shine */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <Wallet className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Wallet Balance</h3>
              <p className="text-2xl font-black text-white leading-none mt-1">
                {loading ? "₹----" : `₹${balance.toLocaleString()}`}
              </p>
            </div>
          </div>
          <button
            onClick={onAddFunds}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            title="Add Funds"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={onWithdraw}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-white uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95"
          >
            <Landmark className="w-3.5 h-3.5 text-indigo-400" />
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
