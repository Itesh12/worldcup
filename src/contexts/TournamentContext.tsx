"use client";

import React, { useState, useEffect, useCallback, useContext } from 'react';
import { TournamentContext, TournamentContextType } from './TournamentContextCore';

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
    
    // Diagnostic check for context availability
    if (context === undefined) {
        console.error("useTournament: Context is undefined! Are you sure the component is wrapped in TournamentProvider?");
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    
    return context;
}
