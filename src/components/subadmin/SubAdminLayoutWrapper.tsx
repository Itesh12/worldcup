"use client";

import React, { useState } from "react";
import { SubAdminSidebar } from "./SubAdminSidebar";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export function SubAdminLayoutWrapper({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen bg-[#050B14] text-white">
            {/* Sidebar Component */}
            <SubAdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* Mobile Header Overlay */}
                <header className="lg:hidden h-16 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                            <Menu className="w-4 h-4 text-white" />
                        </div>
                        <h1 className="text-sm font-black text-white italic uppercase tracking-tighter">
                            FRANCHISE <span className="text-purple-500">DASHBOARD</span>
                        </h1>
                    </div>
                    
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2 bg-white/5 border border-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                        <Menu className="w-5 h-5" />
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
