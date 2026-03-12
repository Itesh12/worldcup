"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, IndianRupee, ArrowUpRight, ChevronRight, Loader2, Landmark, Smartphone, CheckCircle2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface PayoutMethod {
  _id: string;
  type: "upi" | "bank";
  label: string;
  details: string;
  isDefault: boolean;
}

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  balance: number;
}

export function WithdrawDialog({ isOpen, onClose, onSuccess, balance }: WithdrawDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetchingMethods, setFetchingMethods] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMethods();
    }
  }, [isOpen]);

  const fetchMethods = async () => {
    try {
      setFetchingMethods(true);
      const res = await fetch("/api/user/payout-methods", { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
        const defaultMethod = data.find((m: any) => m.isDefault) || data[0];
        if (defaultMethod) setSelectedMethodId(defaultMethod._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingMethods(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const numAmount = Number(amount);
    
    if (!numAmount || isNaN(numAmount) || numAmount < 100) {
      toast.error("Minimum withdrawal is ₹100");
      return;
    }

    if (numAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    const selectedMethod = methods.find(m => m._id === selectedMethodId);
    if (!selectedMethod) {
      toast.error("Please select a withdrawal method");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/withdraw/request", {
        method: "POST",
        body: JSON.stringify({ 
          amount: numAmount,
          method: selectedMethod.type,
          accountDetails: `${selectedMethod.label}: ${selectedMethod.details}`
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        toast.success("Withdrawal request submitted!");
        onSuccess();
        onClose();
        setAmount("");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to submit request");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#050B14] border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 blur-[60px] rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <IndianRupee className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Withdraw <span className="text-amber-500">Funds</span></h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Select Payout Account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Amount to Withdraw</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors font-black">₹</div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Min ₹100"
                  className="w-full bg-slate-900/50 border border-white/5 focus:border-amber-500/50 rounded-2xl pl-10 pr-5 py-4 text-white text-lg font-black focus:outline-none transition-all"
                />
              </div>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest pl-1">
                Available: <span className="text-white">₹{balance.toLocaleString()}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Payout Account</label>
                {methods.length > 0 && (
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{methods.length} Saved</span>
                )}
              </div>

              {fetchingMethods ? (
                <div className="py-10 flex flex-col items-center justify-center bg-white/5 border border-white/5 rounded-2xl gap-3">
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Loading methods...</p>
                </div>
              ) : methods.length === 0 ? (
                <div className="p-8 text-center bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                  <p className="text-xs font-bold text-rose-400 mb-4 italic leading-relaxed">
                    You haven't added any withdrawal methods yet.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                  >
                    Add in Profile
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                  {methods.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      onClick={() => setSelectedMethodId(m._id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                        selectedMethodId === m._id 
                          ? "bg-indigo-600/10 border-indigo-500/50 ring-1 ring-indigo-500/20" 
                          : "bg-white/5 border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${
                          selectedMethodId === m._id ? "bg-indigo-500 text-white" : "bg-slate-900 text-slate-500"
                        }`}>
                          {m.type === "upi" ? <Smartphone className="w-4 h-4" /> : <Landmark className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white uppercase tracking-tight">{m.label}</p>
                          <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-widest mt-0.5">
                            {m.type} Account
                          </p>
                        </div>
                      </div>
                      {selectedMethodId === m._id && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !amount || !selectedMethodId}
                className="w-full group flex items-center justify-center gap-3 py-5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-95 overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Confirm Withdrawal
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
