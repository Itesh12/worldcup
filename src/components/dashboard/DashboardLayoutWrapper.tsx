"use client";

import React from "react";
import { DashboardHeader } from "./DashboardHeader";
import { useTournament } from "@/contexts/TournamentContext";

interface DashboardLayoutWrapperProps {
    children: React.ReactNode;
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
    return (
        <div className="flex flex-col h-screen bg-[#050B14] relative overflow-hidden">
            {/* Constant Global Appbar */}
            <DashboardHeader />

            {/* Ambient Background Backlights */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
            
            {/* Scrollable Content Area */}
            <main className="flex-1 relative z-10 w-full overflow-y-auto scrollbar-hide pb-24 md:pb-12">
                <div className="max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation (Inherited from Root if applicable) */}
        </div>
    );
}
