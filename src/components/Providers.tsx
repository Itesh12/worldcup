"use client";

import React from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { TournamentProvider } from "@/contexts/TournamentContext";
import GlobalLoader from "@/components/GlobalLoader";
import { BottomNav } from "@/components/BottomNav";

import { ToastProvider } from "@/contexts/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LoadingProvider>
            <TournamentProvider>
                <AuthProvider>
                    <ToastProvider>
                        <GlobalLoader />
                        {children}
                        <BottomNav />
                    </ToastProvider>
                </AuthProvider>
            </TournamentProvider>
        </LoadingProvider>
    );
}
