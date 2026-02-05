
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Trophy, LogOut, ArrowLeft, Swords } from "lucide-react";

export function AdminSidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Matches", href: "/admin/matches", icon: Swords },
        { name: "Users", href: "/admin/users", icon: Users },
        { name: "Global Leaderboard", href: "/admin/leaderboard", icon: Trophy },
    ];

    return (
        <aside className="w-72 bg-background/80 backdrop-blur-xl border-r border-white/5 flex flex-col relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none" />

            <div className="p-8 relative z-10">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white tracking-tight">ADMIN</h2>
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">Dashboard</span>
                    </div>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
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
                </nav>
            </div>

            <div className="mt-auto p-8 relative z-10 border-t border-white/5">
                <Link href="/" className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-slate-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Back to Site</span>
                </Link>
            </div>
        </aside>
    );
}
