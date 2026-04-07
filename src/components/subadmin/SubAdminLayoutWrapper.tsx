"use client";

import React, { useState, Suspense } from "react";
import { SubAdminSidebar } from "./SubAdminSidebar";
import { Menu, X, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";

export function SubAdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex h-screen bg-[#050B14] text-white overflow-hidden">
            {/* Sidebar Component */}
            <Suspense fallback={<div className="w-64 bg-[#050B14] border-r border-white/5" />}>
                <SubAdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            </Suspense>


            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Unified Franchise Header (Constant & Sticky) */}
                <header className="sticky top-0 z-[60] bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-purple-500" />
                        <h1 className="text-sm font-black text-white italic uppercase tracking-tighter">
                            FRANCHISE <span className="text-purple-500 font-black">DASHBOARD</span>
                        </h1>
                    </div>
                    
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30 hover:bg-purple-500 transition-all active:scale-90 select-none"
                    >
                        <Menu className="w-5 h-5 text-white" />
                    </button>
                </header>

                {/* Content Container */}
                <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-[#050B14]">
                    {/* Background Ambience */}
                    <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none" />
                    <div className="absolute -top-[100px] right-0 w-[400px] h-[400px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
