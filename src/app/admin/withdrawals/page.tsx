"use client";

import React, { useEffect, useState } from "react";
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
  Loader2
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "failed">("pending");
  const [adminNote, setAdminNote] = useState("");

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/withdrawals");
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (err) {
      toast.error("Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
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
        toast.success(`Withdrawal ${action}ed successfully`);
        fetchWithdrawals();
        setAdminNote("");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to process request");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    filter === "all" ? true : w.status === filter
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 group"
        >
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/20">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Back to Admin</span>
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
              Withdrawal <span className="text-amber-500">Requests</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium">Manage and process user payout requests securely.</p>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
            {(["all", "pending", "completed", "failed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filter === f 
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Syncing Requests...</p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] py-32 text-center">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5 mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-white font-black uppercase tracking-widest mb-2">No Requests Found</h3>
            <p className="text-slate-500 text-xs">All clear! No pending withdrawals in this category.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredWithdrawals.map((w) => (
              <div 
                key={w._id}
                className="group bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden hover:border-amber-500/20 transition-all duration-500"
              >
                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8">
                  {/* User Info */}
                  <div className="md:w-1/3 flex flex-col justify-between p-6 bg-slate-900/50 rounded-3xl border border-white/5">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                          <IndianRupee className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Requested Amount</p>
                          <p className="text-2xl font-black text-white">₹{Math.abs(w.amount).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-white leading-tight">{w.userId?.name || "Unknown User"}</p>
                        <p className="text-xs text-slate-500 font-medium">{w.userId?.email}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {new Date(w.createdAt).toLocaleDateString()} at {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        w.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        w.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        'bg-rose-500/10 border-rose-500/20 text-rose-500'
                      }`}>
                        {w.status}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details & Actions */}
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="bg-slate-900/50 rounded-3xl p-8 border border-white/5">
                      <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment Destination Details</span>
                      </div>
                      <p className="text-sm font-mono text-white bg-black/40 p-5 rounded-2xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                        {w.description}
                      </p>
                    </div>

                    {w.status === 'pending' && (
                      <div className="space-y-4">
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="Add a private note or transaction reference..."
                            value={processingId === w._id ? adminNote : ""}
                            onChange={(e) => {
                              setProcessingId(w._id);
                              setAdminNote(e.target.value);
                            }}
                            className="w-full bg-slate-900/50 border border-white/5 focus:border-indigo-500/50 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-slate-700 focus:outline-none transition-all"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button
                            disabled={!!processingId}
                            onClick={() => handleProcess(w._id, 'approve')}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-xl shadow-emerald-900/20"
                          >
                            {processingId === w._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Mark as Completed</span>
                              </>
                            )}
                          </button>
                          <button
                            disabled={!!processingId}
                            onClick={() => handleProcess(w._id, 'reject')}
                            className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-rose-600 inline-flex border border-white/10 hover:border-rose-500 text-slate-300 hover:text-white rounded-2xl transition-all"
                          >
                            {processingId === w._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Reject Request</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {w.status !== 'pending' && (
                      <div className="flex items-center gap-3 p-6 bg-white/5 rounded-3xl border border-white/5">
                        <div className={`p-2 rounded-xl ${w.status === 'completed' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                          {w.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-500" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Processed on {new Date(w.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
