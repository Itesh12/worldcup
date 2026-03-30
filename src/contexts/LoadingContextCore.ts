"use client";

import { createContext } from 'react';

export interface LoadingContextType {
    isLoading: boolean;
    startLoading: () => void;
    stopLoading: () => void;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);
