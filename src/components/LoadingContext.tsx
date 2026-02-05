"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface LoadingContextType {
    isLoading: boolean;
    startLoading: () => void;
    stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Global counter to track active requests across the whole app immediately
let activeRequests = 0;
let onCountChange: (count: number) => void = () => { };

if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
        const options = args[1] as RequestInit | undefined;
        const isSilent = options?.headers &&
            ((options.headers as any)['x-silent-fetch'] === 'true' ||
                (options.headers as any).get?.('x-silent-fetch') === 'true');

        if (!isSilent) {
            activeRequests++;
            onCountChange(activeRequests);
        }

        try {
            return await originalFetch(...args);
        } finally {
            if (!isSilent) {
                activeRequests = Math.max(0, activeRequests - 1);
                onCountChange(activeRequests);
            }
        }
    };
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [loadingCount, setLoadingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Sync the local loading count with the global request tracker
    useEffect(() => {
        onCountChange = (count) => {
            setLoadingCount(count);
        };
        // Catch up with any requests already in progress
        setLoadingCount(activeRequests);
    }, []);

    const startLoading = useCallback(() => {
        // This can still be used manually
        setLoadingCount(prev => prev + 1);
    }, []);

    const stopLoading = useCallback(() => {
        setLoadingCount(prev => Math.max(0, prev - 1));
    }, []);

    // Effect to handle actual loading state with a small debounce to prevent flickering
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (loadingCount > 0) {
            setIsLoading(true);
        } else {
            // Wait 200ms before hiding to smooth out transitions between multiple calls
            timeout = setTimeout(() => {
                setIsLoading(false);
            }, 200);
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [loadingCount]);

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
