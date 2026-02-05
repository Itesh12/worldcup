"use client";

import { useLoading } from "./LoadingContext";
import { Trophy } from "lucide-react";

export default function GlobalLoader() {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div className="fixed inset-0 bg-[#020617]/60 flex flex-col items-center justify-center z-[9999] backdrop-blur-md animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none" />

            <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-8 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse-slow" />

                {/* Logo */}
                <div className="relative z-10 animate-bounce-slow">
                    <Trophy className="w-24 h-24 text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
                    <div className="absolute -top-3 -right-3 bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-1 rounded-full shadow-lg transform rotate-12">
                        LIVE
                    </div>
                </div>
            </div>

            {/* Text & Progress */}
            <div className="mt-10 flex flex-col items-center gap-4">
                <div className="flex flex-col items-center">
                    <h2 className="text-2xl font-black text-white tracking-[0.3em] uppercase">
                        Syncing
                    </h2>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] mt-1">
                        World Cup Hub
                    </p>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 animate-width-grow" />
                </div>
            </div>

            {/* Ambient Noise Overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
        </div>
    );
}
