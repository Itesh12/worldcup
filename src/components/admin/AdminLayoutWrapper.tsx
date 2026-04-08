
"use client";

import { useState, Suspense } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Menu, Trophy, ShieldAlert, Radio } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "../NotificationBell";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-white overflow-hidden">
            <Suspense fallback={<div className="w-72 bg-[#050B14] border-r border-white/5" />}>
                <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            </Suspense>


            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
                {/* Unified Command Center Header (Constant & Sticky) */}
                <header className="sticky top-0 z-[60] bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 py-4 shrink-0">
                    <div className="max-w-[1600px] mx-auto px-4 md:px-10 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Trophy className="w-5 h-5 md:w-8 md:h-8 text-indigo-500 shrink-0 lg:hidden" />
                            <div className="flex flex-col gap-1.5">
                                <h1 className="text-sm md:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                                    System <span className="text-indigo-500 font-black">Command</span> <span className="text-slate-500 font-black not-italic ml-1 hidden xs:inline">Center</span>
                                </h1>
                                <div className="flex items-center gap-3">
                                    <div className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                        Global Master HQ
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full backdrop-blur-md">
                                        <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest leading-none">Oversight Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Suspense fallback={<div className="w-10 h-10 bg-slate-800/20 rounded-xl" />}>
                                <NotificationBell />
                            </Suspense>

                            <Link
                                href="/dashboard?view=player"
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600 hover:border-indigo-500 text-indigo-300 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                            >
                                Player View
                            </Link>
                            
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="lg:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95"
                            >
                                <Menu className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto scrollbar-hide bg-[url('/grid-pattern.svg')] bg-fixed relative pb-24 lg:pb-0">
                    <div className="absolute inset-0 bg-[#050B14]/90 pointer-events-none" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
