"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutDashboard, Users, Trophy, LogOut, ArrowLeft, Swords, X, IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface AdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const isPlayerView = searchParams.get("view") === "player";

    // Prevent background scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Arenas", href: "/admin/arenas", icon: Swords },
        { name: "Leagues", href: "/admin/tournaments", icon: Trophy },
        { name: "Payouts", href: "/admin/withdrawals", icon: IndianRupee },
    ];

    const SidebarContent = (
        <div className="h-full flex flex-col relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

            {/* Top / Main Navigation */}
            <div className="p-8 relative z-10 flex-1">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">MANAGEMENT</h2>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Control Center</span>
                        </div>
                    </div>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={isPlayerView ? `${item.href}?view=player` : item.href}
                                onClick={onClose}
                                className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                    ? "bg-indigo-600/10 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                    : "hover:bg-white/5 border border-transparent"
                                    }`}
                            >
                                {/* Active Indicator Bar */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]" />
                                )}

                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-indigo-400 group-shadow-indigo-500" : "text-slate-400 group-hover:text-white"}`} />
                                <span className={`text-sm font-bold tracking-wide ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
 
                    {/* Mobile-Only Action: Player View */}
                    <div className="lg:hidden pt-4 mt-4 border-t border-white/5">
                        <Link
                            href="/dashboard?view=player"
                            onClick={onClose}
                            className="group flex items-center gap-4 px-4 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-500/20"
                        >
                            <LayoutDashboard className="w-5 h-5 text-white" />
                            <span className="text-sm font-black text-white uppercase tracking-widest">
                                Switch to Player View
                            </span>
                        </Link>
                    </div>
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="mt-auto px-8 py-8 relative z-10 space-y-4">
                <button 
                    onClick={() => {
                        const { signOut } = require("next-auth/react");
                        signOut({ callbackUrl: "/login" });
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300 group"
                >
                    <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-sm font-black uppercase tracking-widest">Terminate Session</span>
                </button>

                <div className="text-center opacity-30 mt-auto">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Premium Admin Suite v2.0</p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 flex-shrink-0 bg-[#050B14]/80 backdrop-blur-xl border-r border-white/5 flex-col relative z-50">
                {SidebarContent}
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden"
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 left-0 bottom-0 w-72 bg-[#050B14] border-r border-white/5 z-[1001] lg:hidden shadow-2xl"
                        >
                            {SidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
