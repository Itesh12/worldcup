
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowRight, Sparkles, User, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";

export default function LandingPage() {
    const [step, setStep] = useState<"splash" | "intro" | "auth">("splash");
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        // Splash screen timer
        const timer = setTimeout(() => {
            if (status === "authenticated") {
                router.push("/dashboard");
            } else {
                setStep("intro");
            }
        }, 2500);

        return () => clearTimeout(timer);
    }, [status, router]);

    const handleGetStarted = () => {
        setStep("auth");
    };

    if (status === "loading" || (status === "authenticated" && step === "splash")) {
        return <SplashScreen />;
    }

    if (step === "splash") {
        return <SplashScreen />;
    }

    if (step === "intro") {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="w-full max-w-2xl space-y-12 relative z-10">
                    <div className="relative w-32 h-32 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(99,102,241,0.5)] mb-8 transform rotate-3 animate-float">
                        <Trophy className="w-16 h-16 text-white drop-shadow-md" />
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-xs font-black px-2 py-1 rounded-full shadow-lg transform rotate-12">
                            2026
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-none">
                            WORLD CUP <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                HUB
                            </span>
                        </h1>
                        <p className="text-slate-400 text-xl font-medium max-w-md mx-auto leading-relaxed">
                            The ultimate platform for live scoring, real-time stats, and global leaderboards.
                        </p>
                    </div>

                    <button
                        onClick={handleGetStarted}
                        className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white transition-all duration-300 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                        <span className="mr-3">Enter the Arena</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 animate-in zoom-in-95 duration-500 relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-[#050B14] to-[#050B14]" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-0 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10">
                {/* Left Side: Visual */}
                <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-6">
                            <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-white leading-tight mb-4">
                            Join the <br /> Champions.
                        </h2>
                        <p className="text-indigo-100 font-medium text-sm leading-relaxed opacity-90">
                            Experience the thrill of the World Cup with real-time analytics and community.
                        </p>
                    </div>
                    <div className="relative z-10 flex items-center gap-2 text-xs font-bold text-indigo-200 uppercase tracking-widest mt-12">
                        <Sparkles className="w-4 h-4" />
                        Official Hub
                    </div>
                </div>

                {/* Right Side: Actions */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="text-center md:text-left mb-10">
                        <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
                        <p className="text-slate-400 text-sm">Select a method to continue</p>
                    </div>

                    <div className="space-y-4">
                        <Link
                            href="/login"
                            className="group flex items-center justify-center gap-3 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/20 hover:shadow-indigo-500/30"
                        >
                            <User className="w-5 h-5 opacity-80" />
                            Sign In
                        </Link>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-700"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0f1729] px-2 text-slate-500 font-bold">Or</span>
                            </div>
                        </div>

                        <Link
                            href="/register"
                            className="group flex items-center justify-center gap-3 w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                        >
                            <UserPlus className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            Create Account
                        </Link>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-500">
                            Protected by reCAPTCHA and subject to the Google <a href="#" className="underline hover:text-slate-400">Privacy Policy</a> and <a href="#" className="underline hover:text-slate-400">Terms of Service</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SplashScreen() {
    return (
        <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-50 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020617] to-[#020617]" />
            <div className="relative">
                <div className="absolute -inset-4 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse-slow" />
                <Trophy className="w-20 h-20 text-white relative z-10 animate-bounce-slow drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
            </div>
            <div className="mt-8 flex flex-col items-center gap-2">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-[0.2em] uppercase animate-in fade-in slide-in-from-bottom-5 duration-1000">
                    World Cup
                </h1>
                <div className="h-0.5 w-12 bg-indigo-600 rounded-full animate-width-grow" />
            </div>
        </div>
    );
}
