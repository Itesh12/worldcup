"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer, ToastType } from '../components/ui/Toast';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType, duration?: number) => void;
    hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType, duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        
        // Premium Error Mapping
        let displayMessage = message;
        if (type === 'error') {
            if (message.toLowerCase().includes('insufficient balance')) {
                displayMessage = "Insufficient Balance! Please top up your wallet to join this arena.";
            } else if (message.toLowerCase().includes('entry closed')) {
                displayMessage = "Entry Closed! This arena has already entered the reveal phase.";
            } else if (message.toLowerCase().includes('already joined')) {
                displayMessage = "Double Entry Protect: You are already in this arena!";
            } else if (message.toLowerCase().includes('arena is full')) {
                displayMessage = "Sold Out! This arena is currently full.";
            } else if (message.toLowerCase().includes('unauthorized')) {
                displayMessage = "Session Expired: Please log in again to continue.";
            }
        }

        setToasts((prev) => [...prev, { id, message: displayMessage, type, duration }]);

        setTimeout(() => {
            hideToast(id);
        }, duration);
    }, [hideToast]);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            <ToastContainer toasts={toasts} onHide={hideToast} />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
