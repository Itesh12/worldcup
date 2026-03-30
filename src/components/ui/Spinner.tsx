"use client";

import React from "react";
import { Trophy } from "lucide-react";

interface SpinnerProps {
  fullScreen?: boolean;
  message?: string;
  subMessage?: string;
}

export function Spinner({ 
  fullScreen = false, 
  message = "Syncing", 
  subMessage = "World Cup Hub" 
}: SpinnerProps) {
  
  const content = (
    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
      <div className="relative">
        {/* Glow Effect */}
        <div className="absolute -inset-8 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse-slow" />

        {/* Logo */}
        <div className="relative z-10 animate-bounce-slow">
            <Trophy className="w-20 h-20 text-white drop-shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
            <div className="absolute -top-3 -right-3 bg-yellow-400 text-slate-900 text-[10px] font-black px-2 py-1 rounded-full shadow-lg transform rotate-12">
                LIVE
            </div>
        </div>
      </div>

      {/* Text & Progress */}
      <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center">
              <h2 className="text-xl font-black text-white tracking-[0.3em] uppercase">
                  {message}
              </h2>
              <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.5em] mt-1">
                  {subMessage}
              </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-600 animate-width-grow" />
          </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617]/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none" />
        {content}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 w-full min-h-[40vh]">
      {content}
    </div>
  );
}
