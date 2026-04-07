"use client";

import React, { Suspense } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { LivePulseTicker } from "./LivePulseTicker";
import { Sidebar } from "../layout/Sidebar";
import { useTournament } from "@/contexts/TournamentContext";

interface DashboardLayoutWrapperProps {
    children: React.ReactNode;
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
    return (
        <div className="flex bg-[#050B14] relative overflow-hidden min-h-screen">
            <Suspense fallback={<div className="w-72 bg-[#050B14] border-r border-white/5" />}>
                <Sidebar />
            </Suspense>

            <div className="flex-1 flex flex-col h-screen relative overflow-hidden lg:ml-72">
                {/* Constant Global Appbar */}
                <Suspense fallback={<div className="h-20 bg-[#050B14] border-b border-white/5" />}>
                    <DashboardHeader />
                </Suspense>

                {/* Real-time Score Ticker (Live Pulse) - Sticky top */}
                <LivePulseTicker />

                {/* Ambient Background Backlights */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
                
                {/* Scrollable Content Area */}
                <main className="flex-1 relative z-10 w-full overflow-y-auto scrollbar-hide pb-24 md:pb-12">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
