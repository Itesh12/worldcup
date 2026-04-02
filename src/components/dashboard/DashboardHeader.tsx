"use client";

import React from "react";
import { Trophy, RefreshCcw, LayoutDashboard, Menu, LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserContextSwitcher } from "@/components/UserContextSwitcher";
import { useTournament } from "@/contexts/TournamentContext";

interface DashboardHeaderProps {
    refreshing?: boolean;
    onRefresh?: () => void;
}

export function DashboardHeader({ refreshing, onRefresh }: DashboardHeaderProps) {
    const { data: session } = useSession();
    const { setTournamentId } = useTournament();

    return (
        <header className="sticky top-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 h-16 md:h-20 flex items-center shrink-0">
            <div className="max-w-7xl mx-auto px-4 md:px-6 w-full flex items-center justify-between gap-4">
                {/* Brand Identity */}
                <Link href="/dashboard" className="flex items-center gap-2 md:gap-3 min-w-0 font-bold group">
                    <Trophy className="w-5 h-5 md:w-8 md:h-8 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                        <h1 className="text-xs md:text-xl font-black text-white tracking-tight leading-none uppercase italic">
                            WORLD CUP <span className="text-indigo-500">HUB</span>
                        </h1>
                        <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest hidden xs:block mt-0.5 md:mt-1">
                            Official Player Portal
                        </p>
                    </div>
                </Link>

                {/* Switcher & Tools */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {/* Desktop Tournament Switcher */}
                    <div className="hidden lg:flex items-center gap-2 w-[280px]">
                        <UserContextSwitcher onSelect={(id) => setTournamentId(id || "")} />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => onRefresh?.()}
                        disabled={refreshing}
                        className={`flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-xl bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all group ${refreshing ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 md:w-4 md:h-4 ${refreshing ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                    </button>

                    {/* Admin/Sub-Admin Quick Access */}
                    {session?.user && ((session.user as any).role === "admin" || (session.user as any).role === "subadmin") ? (
                        <Link
                            href={(session.user as any).role === "admin" ? "/admin" : "/subadmin"}
                            className="hidden md:flex items-center gap-2 px-4 md:px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] md:text-xs font-black uppercase tracking-widest rounded-xl transition-all border border-indigo-500/20 shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                            <span className="hidden sm:inline">Command Center</span>
                        </Link>
                    ) : (
                        <button
                            onClick={() => {
                                const { signOut } = require("next-auth/react");
                                signOut({ callbackUrl: "/login" });
                            }}
                            className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-800/40 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 group"
                        >
                            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            <span>Sign Out</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
