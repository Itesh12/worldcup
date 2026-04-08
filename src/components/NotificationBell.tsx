"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, Info, IndianRupee, Trophy, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'money' | 'match';
    isRead: boolean;
    link?: string;
    createdAt: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Refresh every 2 minutes
        const interval = setInterval(fetchNotifications, 120000);
        return () => clearInterval(interval);
    }, []);

    const markAllAsRead = async () => {
        try {
            const res = await fetch('/api/notifications', { method: 'POST' });
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark notifications as read", error);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'money': return <IndianRupee className="w-3 h-3 text-emerald-400" />;
            case 'match': return <Trophy className="w-3 h-3 text-indigo-400" />;
            case 'warning': return <AlertTriangle className="w-3 h-3 text-amber-400" />;
            case 'success': return <Check className="w-3 h-3 text-emerald-400" />;
            default: return <Info className="w-3 h-3 text-blue-400" />;
        }
    };

    const getTypeBg = (type: string) => {
        switch (type) {
            case 'money': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'match': return 'bg-indigo-500/10 border-indigo-500/20';
            case 'warning': return 'bg-amber-500/10 border-amber-500/20';
            case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
            default: return 'bg-blue-500/10 border-blue-500/20';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 rounded-xl bg-slate-800/40 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all active:scale-95 group"
            >
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050B14] shadow-[0_0_8px_#ef4444]" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-[320px] md:w-[380px] max-h-[480px] bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
                        >
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllAsRead}
                                        className="text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div 
                                            key={notif._id}
                                            className={`px-5 py-4 hover:bg-white/5 transition-colors border-l-2 ${notif.isRead ? 'border-transparent' : 'border-indigo-500 bg-indigo-500/5'}`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border ${getTypeBg(notif.type)}`}>
                                                    {getTypeIcon(notif.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[11px] font-bold text-white mb-0.5 leading-tight">{notif.title}</h4>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{notif.message}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {notif.link && (
                                                            <Link 
                                                                href={notif.link} 
                                                                onClick={() => setIsOpen(false)}
                                                                className="flex items-center gap-1 text-[8px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest"
                                                            >
                                                                View <ExternalLink className="w-2 h-2" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                                        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mb-3">
                                            <Bell className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No notifications yet</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-3 border-t border-white/5 bg-slate-900/50 text-center">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">End of Feed</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
