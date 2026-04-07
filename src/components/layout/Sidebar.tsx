"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    Trophy, 
    LayoutDashboard, 
    Swords, 
    Wallet, 
    BarChart3, 
    ShieldCheck, 
    LogOut,
    Menu,
    X,
    ChevronRight,
    Settings,
    History
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { UserContextSwitcher } from '@/components/UserContextSwitcher';
import { motion, AnimatePresence } from 'framer-motion';

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);

    const userRole = (session?.user as any)?.role || 'player';

    const navItems = [
        { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { id: 'arenas', name: 'My Arenas', href: userRole === 'player' ? '/matches' : '/subadmin/arenas', icon: Swords },
        { id: 'wallet', name: 'Wallet', href: '/dashboard', icon: Wallet }, 
        { id: 'transactions', name: 'Transactions', href: '/wallet/history', icon: History },
        { id: 'insights', name: 'Insights', href: '/dashboard', icon: BarChart3 },
    ];

    const adminItems = [
        { name: 'Admin Hub', href: '/admin', icon: ShieldCheck, role: 'admin' },
        { name: 'Franchise Hub', href: '/subadmin', icon: Settings, role: 'subadmin' },
    ].filter(item => item.role === userRole || (userRole === 'admin' && item.role === 'subadmin'));

    const SidebarContent = () => (
        <div className="flex flex-col h-full py-8 px-6 bg-slate-950/40 backdrop-blur-3xl border-r border-white/5 shadow-2xl relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            
            {/* Branding */}
            <div className="mb-12 relative z-10">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform duration-500 border border-indigo-400/30">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">
                            WORLD CUP <span className="text-indigo-500">HUB</span>
                        </h2>
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Official Portal</p>
                    </div>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 space-y-2 relative z-10">
                <div className="px-2 mb-4">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] px-2">Navigation</span>
                </div>
                {navItems.map((item) => {
                    let isActive = pathname === item.href;
                    
                    // Specific priority for /dashboard to avoid multiple highlights
                    if (pathname === '/dashboard') {
                        isActive = item.id === 'dashboard'; // Only highlight Dashboard link
                    }
                    
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                                isActive 
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">{item.name}</span>
                            {isActive && <motion.div layoutId="active-nav" className="ml-auto w-1 h-3 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
                        </Link>
                    );
                })}

                {adminItems.length > 0 && (
                    <div className="pt-8 space-y-2">
                        <div className="px-2 mb-4">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] px-2">Control Plane</span>
                        </div>
                        {adminItems.map((item) => {
                            const isActive = pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                                        isActive 
                                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'group-hover:scale-110 transition-transform'}`} />
                                    <span className="text-[11px] font-black uppercase tracking-widest leading-none">{item.name}</span>
                                    {isActive && <motion.div layoutId="active-admin" className="ml-auto w-1 h-3 bg-purple-500 rounded-full" />}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </nav>

            {/* Bottom Actions & Switcher */}
            <div className="mt-auto space-y-6 relative z-10 pt-8 border-t border-white/5">
                <div className="px-2">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Environment</span>
                </div>
                
                {/* Migrated Content Switcher */}
                <div className="w-full">
                    <UserContextSwitcher />
                </div>

                <div className="flex items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-white italic">{session?.user?.name?.[0] || 'U'}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-white uppercase italic truncate">{session?.user?.name || 'User'}</p>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest truncate">{userRole}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        className="p-2.5 bg-slate-800/40 hover:bg-red-500/10 rounded-xl border border-white/10 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all active:scale-95 group"
                    >
                        <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Fixed Sidebar */}
            <aside className="hidden lg:block w-72 h-screen fixed left-0 top-0 z-[60]">
                <SidebarContent />
            </aside>

            {/* Mobile Header Overlay */}
            <div className="lg:hidden fixed bottom-6 right-6 z-[70]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-2xl shadow-indigo-600/40 border border-white/10 active:scale-90 transition-transform"
                >
                    {isOpen ? <X className="text-white w-6 h-6" /> : <Menu className="text-white w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Side Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed left-0 top-0 bottom-0 w-[280px] z-[66] lg:hidden"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
