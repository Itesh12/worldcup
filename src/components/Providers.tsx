"use client";

import React from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { TournamentProvider } from "@/contexts/TournamentContext";
import GlobalLoader from "@/components/GlobalLoader";
import { BottomNav } from "@/components/BottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LoadingProvider>
            <TournamentProvider>
                <AuthProvider>
                    <GlobalLoader />
                    {children}
                    <BottomNav />
                </AuthProvider>
            </TournamentProvider>
        </LoadingProvider>
    );
}
