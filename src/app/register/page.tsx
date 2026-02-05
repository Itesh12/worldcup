
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, User, Sparkles, Trophy, CheckCircle, Upload } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [image, setImage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, image }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to register");
            }

            router.push("/login");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            <div className="w-full max-w-6xl grid md:grid-cols-5 gap-0 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10 min-h-[700px]">

                {/* Left Side: Visual (2 cols) */}
                <div className="hidden md:flex md:col-span-2 flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 to-slate-950 relative overflow-hidden text-white border-r border-white/5">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay"></div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />

                    <div className="relative z-10">
                        <Link href="/" className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-500/30 transition-colors border border-indigo-500/30">
                            <Trophy className="w-4 h-4 text-indigo-300" />
                            World Cup Hub
                        </Link>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/50 mb-4 animate-float">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-4xl font-black leading-tight">
                            Start your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                Legacy.
                            </span>
                        </h2>
                        <ul className="space-y-4">
                            {[
                                "Create your player profile",
                                "Upload your verified avatar",
                                "Join the global roster"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-indigo-100 font-medium text-sm">
                                    <CheckCircle className="w-5 h-5 text-indigo-400" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative z-10">
                        <p className="text-xs text-indigo-200/40 font-medium uppercase tracking-widest">
                            Join 500+ Players Today
                        </p>
                    </div>
                </div>

                {/* Right Side: Form (3 cols) */}
                <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-center bg-slate-950/50">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
                        <p className="text-slate-400 text-sm">Join the platform to start competing in matches.</p>
                    </div>

                    {error && (
                        <div className="p-4 mb-6 text-sm text-red-200 bg-red-900/30 border border-red-800/50 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Avatar Section */}
                            <div className="flex-shrink-0 flex flex-col items-center">
                                <div className="p-1">
                                    <ImageUpload value={image} onChange={setImage} label="" />
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-500 mt-2 tracking-widest">Profile Photo</span>
                            </div>

                            {/* Inputs Section */}
                            <div className="flex-1 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-purple-500 transition-colors" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
                        <p className="text-slate-400 text-sm">
                            Already have an account?{" "}
                            <Link href="/login" className="text-purple-500 hover:text-purple-400 font-bold hover:underline">
                                Login now
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
