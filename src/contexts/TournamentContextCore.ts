"use client";

import { createContext } from 'react';

export interface TournamentContextType {
    tournamentId: string | null;
    setTournamentId: (id: string | null) => void;
}

// Single Context Identity for the entire application (forced singleton)
export const TournamentContext = createContext<TournamentContextType | undefined>(undefined);
