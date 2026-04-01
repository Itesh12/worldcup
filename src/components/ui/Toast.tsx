"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Info, 
    X 
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    toasts: ToastItem[];
    onHide: (id: string) => void;
}

export function ToastContainer({ toasts, onHide }: ToastContainerProps) {
    return (
        <div className="fixed bottom-24 left-0 right-0 z-[9999] flex flex-col items-center pointer-events-none px-4 gap-3">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} onHide={() => onHide(toast.id)} />
                ))}
            </AnimatePresence>
        </div>
    );
}

function Toast({ toast, onHide }: { toast: ToastItem; onHide: () => void }) {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
        error: <XCircle className="w-5 h-5 text-rose-400" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
    };

    const backgrounds = {
        success: "bg-emerald-500/10 border-emerald-500/20",
        error: "bg-rose-500/10 border-rose-500/20",
        warning: "bg-amber-500/10 border-amber-500/20",
        info: "bg-blue-500/10 border-blue-500/20",
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`pointer-events-auto min-w-[280px] max-w-md ${backgrounds[toast.type]} backdrop-blur-xl border p-4 rounded-[20px] shadow-2xl flex items-center gap-4 group overflow-hidden relative`}
        >
            <div className={`absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-r from-transparent ${
                toast.type === 'success' ? 'to-emerald-400' : 
                toast.type === 'error' ? 'to-rose-400' : 
                toast.type === 'warning' ? 'to-amber-400' : 'to-blue-400'
            }`} />

            <div className="flex-shrink-0">
                {icons[toast.type]}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-[14px] leading-tight font-semibold text-white/95 tracking-tightest">
                    {toast.message}
                </p>
            </div>

            <button 
                onClick={onHide}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-all"
            >
                <X className="w-4 h-4" />
            </button>

            <motion.div 
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 4, ease: "linear" }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 origin-left ${
                    toast.type === 'success' ? 'bg-emerald-500' : 
                    toast.type === 'error' ? 'bg-rose-500' : 
                    toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`}
            />
        </motion.div>
    );
}
