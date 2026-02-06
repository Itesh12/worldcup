
"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { Menu, Trophy } from "lucide-react";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background text-white overflow-hidden">
            <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 flex items-center justify-between px-6 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 z-40 shrink-0">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-indigo-500" />
                        <span className="text-sm font-black text-white tracking-tight uppercase">World Cup Hub</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto bg-[url('/grid-pattern.svg')] bg-fixed relative">
                    <div className="absolute inset-0 bg-[#050B14]/90 pointer-events-none" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
