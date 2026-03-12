"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Landmark, Smartphone, Check, CreditCard, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface PayoutMethod {
  _id: string;
  type: "upi" | "bank";
  label: string;
  details: string;
  isDefault: boolean;
}

export function PayoutMethodManager() {
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newMethod, setNewMethod] = useState({
    type: "upi" as "upi" | "bank",
    label: "",
    details: "",
    bankName: "",
    accountNo: "",
    ifsc: "",
    isDefault: false
  });

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/payout-methods", { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMethods(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMethod.type === "upi" && !newMethod.details) {
      toast.error("Please enter UPI ID");
      return;
    }
    if (newMethod.type === "bank" && (!newMethod.bankName || !newMethod.accountNo || !newMethod.ifsc)) {
      toast.error("Please fill all bank details");
      return;
    }

    setSubmitting(true);
    try {
      const details = newMethod.type === "upi" 
        ? newMethod.details 
        : `Bank: ${newMethod.bankName} | A/C: ${newMethod.accountNo} | IFSC: ${newMethod.ifsc}`;

      const res = await fetch("/api/user/payout-methods", {
        method: "POST",
        body: JSON.stringify({ ...newMethod, details }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        toast.success("Payout method saved");
        setMethods(data.methods); // Immediate update from response
        setShowAddForm(false);
        setNewMethod({ type: "upi", label: "", details: "", bankName: "", accountNo: "", ifsc: "", isDefault: false });
      } else {
        toast.error("Failed to save method");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/user/payout-methods", {
        method: "DELETE",
        body: JSON.stringify({ methodId: id }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Method removed");
        fetchMethods();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch("/api/user/payout-methods", {
        method: "PATCH",
        body: JSON.stringify({ methodId: id }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Default method updated");
        fetchMethods();
      }
    } catch (err) {
      toast.error("Failed to update default");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Saved Payout Methods</span>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-600/20 transition-all"
          >
            <Plus className="w-3 h-3" />
            Add Method
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 bg-slate-900/60 border border-indigo-500/30 rounded-3xl relative overflow-hidden group"
            >
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Enroll New Method</span>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMethod({ ...newMethod, type: "upi" })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                      newMethod.type === "upi" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-slate-500"
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> UPI
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMethod({ ...newMethod, type: "bank" })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${
                      newMethod.type === "bank" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white/5 border-white/10 text-slate-500"
                    }`}
                  >
                    <Landmark className="w-3 h-3" /> Bank
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Label</label>
                    <input
                      type="text"
                      placeholder="e.g. My Personal UPI"
                      value={newMethod.label}
                      onChange={(e) => setNewMethod({ ...newMethod, label: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                      required
                    />
                  </div>

                  {newMethod.type === "upi" ? (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">UPI ID</label>
                      <input
                        type="text"
                        placeholder="e.g. name@upi"
                        value={newMethod.details}
                        onChange={(e) => setNewMethod({ ...newMethod, details: e.target.value })}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          value={newMethod.bankName}
                          onChange={(e) => setNewMethod({ ...newMethod, bankName: e.target.value })}
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                          <input
                            type="text"
                            placeholder="A/C Number"
                            value={newMethod.accountNo}
                            onChange={(e) => setNewMethod({ ...newMethod, accountNo: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">IFSC Code</label>
                          <input
                            type="text"
                            placeholder="IFSC"
                            value={newMethod.ifsc}
                            onChange={(e) => setNewMethod({ ...newMethod, ifsc: e.target.value })}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 mt-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Verify & Save Method"}
                </button>
              </form>
            </motion.div>
          )}

          {methods.map((m, idx) => (
            <motion.div
              key={m._id || `method-${idx}-${m.label}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:border-white/20 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                      {m.type === "upi" ? (
                        <Smartphone className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Landmark className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white uppercase">{m.label}</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(m._id)}
                    className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs font-mono text-slate-400 bg-black/30 p-3 rounded-xl border border-white/5 break-all">
                  {m.details}
                </p>
              </div>
                {m.isDefault ? (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Default Method</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSetDefault(m._id)}
                    className="text-[9px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 transition-colors group/btn"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover/btn:bg-indigo-500 transition-colors" />
                    Mark as Default
                  </button>
                )}
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && methods.length === 0 && !showAddForm && (
          <div className="col-span-full py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No saved payout methods yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
