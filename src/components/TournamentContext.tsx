// Force Turbopack recompilation
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface TournamentContextType {
    tournamentId: string | null;
    setTournamentId: (id: string | null) => void;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
    const [tournamentId, setTournamentIdState] = useState<string | null>(null);

    // Load initial ID from localStorage on mount
    useEffect(() => {
        const storedId = localStorage.getItem('activeTournamentId');
        if (storedId) {
            setTournamentIdState(storedId);
        }
    }, []);

    const setTournamentId = useCallback((id: string | null) => {
        setTournamentIdState(id);
        if (id) {
            localStorage.setItem('activeTournamentId', id);
        } else {
            localStorage.removeItem('activeTournamentId');
        }
    }, []);

    return (
        <TournamentContext.Provider value={{ tournamentId, setTournamentId }}>
            {children}
        </TournamentContext.Provider>
    );
}

export function useTournament() {
    const context = useContext(TournamentContext);
    if (context === undefined) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
}
