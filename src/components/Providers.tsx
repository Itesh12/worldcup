"use client";

import React from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { BottomNavbar } from "@/components/shared/BottomNavbar";
import { TournamentProvider } from "@/contexts/TournamentContext";
import GlobalLoader from "@/components/GlobalLoader";

import { ToastProvider } from "@/contexts/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <LoadingProvider>
            <TournamentProvider>
                <AuthProvider>
                    <ToastProvider>
                        <GlobalLoader />
                        {children}
                        <BottomNavbar />
                    </ToastProvider>
                </AuthProvider>
            </TournamentProvider>
        </LoadingProvider>
    );
}
