"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, IndianRupee, Zap, ChevronRight, Loader2, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface AddFundsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (amount: number) => Promise<void>;
  onSuccess?: () => void;
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000];

export function AddFundsDialog({ isOpen, onClose, onSuccess }: AddFundsDialogProps) {
  const { data: session } = useSession();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount < 10) {
        toast.error("Minimum recharge amount is ₹10");
        return;
    }

    setLoading(true);
    try {
      // 1. Create Order
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        body: JSON.stringify({ amount: numAmount }),
        headers: { "Content-Type": "application/json" },
      });

      if (!orderRes.ok) throw new Error("Failed to create order");
      const order = await orderRes.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "", // We need this on client side
        amount: order.amount,
        currency: order.currency,
        name: "WorldCup Arena",
        description: "Wallet Recharge",
        order_id: order.id,
        handler: async (response: any) => {
           try {
             setLoading(true);
             // 3. Verify Payment
             const verifyRes = await fetch("/api/razorpay/verify", {
               method: "POST",
               body: JSON.stringify({
                 razorpay_order_id: response.razorpay_order_id,
                 razorpay_payment_id: response.razorpay_payment_id,
                 razorpay_signature: response.razorpay_signature,
                 amount: numAmount
               }),
               headers: { "Content-Type": "application/json" },
             });

             if (verifyRes.ok) {
               toast.success("Funds added successfully!");
               onSuccess?.();
               onClose();
               setAmount("");
             } else {
               toast.error("Payment verification failed.");
             }
           } catch (err) {
             toast.error("Verification error.");
           } finally {
             setLoading(false);
           }
        },
        prefill: {
          name: session?.user?.name,
          email: session?.user?.email,
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Payment initiation failed.");
    } finally {
      if (!(window as any).Razorpay) setLoading(false);
      // Wait for handler if opened
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-[#050B14] border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <IndianRupee className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Add <span className="text-indigo-500">Funds</span></h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Instant Recharge</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Quick Select</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt.toString())}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all border ${
                      amount === amt.toString()
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Custom Amount</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors font-black">₹</div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-slate-900/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl pl-10 pr-5 py-4 text-white text-lg font-black focus:outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !amount}
                className="w-full group flex items-center justify-center gap-3 py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:opacity-50 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95 overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Secure Recharge
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
              </button>
              
              <div className="flex items-center justify-center gap-2 mt-6">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Instant balance updates</span>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
