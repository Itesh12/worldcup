"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Trophy, LogOut, ArrowLeft, Swords, X, IndianRupee, PieChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";

interface SubAdminSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export function SubAdminSidebar({ isOpen, onClose }: SubAdminSidebarProps) {
    const pathname = usePathname();

    const navItems = [
        { name: "Overview", href: "/subadmin", icon: LayoutDashboard },
        { name: "My Arenas", href: "/subadmin/arenas", icon: Swords }, // Future link
        { name: "My Users", href: "/subadmin/users", icon: Users }, // Future link
        { name: "Commission", href: "/subadmin/earnings", icon: IndianRupee }, // Future link
    ];

    const SidebarContent = (
        <div className="h-full flex flex-col relative overflow-hidden bg-[#050B14]">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

            <div className="p-8 relative z-10 flex-1">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <PieChart className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight italic uppercase">FRANCHISE</h2>
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Sub-Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = item.href === "/subadmin" ? pathname === "/subadmin" : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${isActive
                                    ? "bg-purple-600/10 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                                    : "hover:bg-white/5 border border-transparent"
                                    }`}
                            >
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-r-full shadow-[0_0_10px_#a855f7]" />
                                )}

                                <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-purple-400" : "text-slate-400 group-hover:text-white"}`} />
                                <span className={`text-sm font-bold tracking-wide ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto px-8 py-8 relative z-10 space-y-4">
                <div className="text-center opacity-30">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">FRANCHISE SUITE v1.0</p>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <aside className="hidden lg:flex w-72 flex-shrink-0 bg-[#050B14]/80 backdrop-blur-xl border-r border-white/5 flex-col relative z-50">
                {SidebarContent}
            </aside>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] lg:hidden"
                        />
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
