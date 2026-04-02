
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
                        <Trophy className="w-5 h-5 text-indigo-500" />
                        <span className="text-sm font-black text-white tracking-tight uppercase italic">Admin <span className="text-indigo-500">Dashboard</span></span>
                    </div>
                    
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-500 transition-all active:scale-95 select-none"
                    >
                        <Menu className="w-5 h-5 text-white" />
                    </button>
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
