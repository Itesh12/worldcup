
"use client";

import { useState } from "react";
import { UserManagementDialogs } from "./UserManagementDialogs";
import { Search, Mail, Clock, ShieldCheck, UserPlus, MousePointer2 } from "lucide-react";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isBanned: boolean;
    image?: string;
    createdAt: string;
}

export function UserManagementView({ initialUsers }: { initialUsers: User[] }) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredUsers = initialUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Search Bar Section */}
            <div className="relative max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-500" />
                </div>
                <input
                    type="text"
                    placeholder="Search agents by name or identity..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/40 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all backdrop-blur-xl shadow-2xl"
                />
            </div>

            {/* Content Display */}
            <div className="relative z-10 w-full">
                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-4">
                    {filteredUsers.map((user) => (
                        <div
                            key={user._id}
                            className={`bg-slate-950/40 backdrop-blur-3xl rounded-[32px] border border-white/5 p-6 flex flex-col gap-5 transition-all ${user.isBanned ? "grayscale-[0.6] opacity-60" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl overflow-hidden ${user.isBanned ? "bg-slate-800" : "bg-gradient-to-br from-indigo-600 to-purple-600"
                                            }`}>
                                            {user.image ? (
                                                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                user.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        {!user.isBanned && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-base font-black text-white tracking-tight truncate flex items-center gap-2">
                                            {user.name}
                                            {user.isBanned && (
                                                <span className="text-[7px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 uppercase">Banned</span>
                                            )}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 font-bold truncate flex items-center gap-1.5 mt-0.5">
                                            <Mail className="w-2.5 h-2.5" /> {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${user.role === 'admin' ? "bg-purple-600/5 text-purple-400 border-purple-500/20" : "bg-indigo-600/5 text-indigo-400 border-indigo-500/20"
                                    }`}>
                                    {user.role}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Registered At</span>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                                <UserManagementDialogs user={user} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block bg-slate-950/20 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-950/40 border-b border-white/5">
                                <th className="px-8 py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Identity Profile</th>
                                <th className="px-8 py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Platform Access</th>
                                <th className="px-8 py-6 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Persistence</th>
                                <th className="px-8 py-6 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Operational Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className={`group transition-all hover:bg-white/[0.02] ${user.isBanned ? "opacity-50" : ""}`}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="relative flex-shrink-0">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center p-[2px] transition-all group-hover:rotate-6 ${user.isBanned ? "bg-slate-800" : "bg-indigo-500 shadow-indigo-500/20"
                                                    }`}>
                                                    <div className="w-full h-full bg-slate-950 rounded-[14px] overflow-hidden flex items-center justify-center">
                                                        {user.image ? (
                                                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-sm font-black text-white">{user.name.charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {!user.isBanned && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-950 rounded-full" />
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-base font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors truncate">
                                                    {user.name}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Mail className="w-2.5 h-2.5 opacity-40" /> {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-purple-600/5 text-purple-400 border-purple-500/20' : 'bg-indigo-600/5 text-indigo-400 border-indigo-500/20'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.role === 'admin' ? 'bg-purple-400' : 'bg-indigo-400'}`} />
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                                <Clock className="w-3 h-3 opacity-40" /> Established
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <UserManagementDialogs user={user} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {filteredUsers.length === 0 && (
                    <div className="text-center py-32 bg-slate-950/20 border-2 border-dashed border-white/5 rounded-[48px] backdrop-blur-md">
                        <UserPlus className="w-16 h-16 text-slate-800 mx-auto mb-6 opacity-20" />
                        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Access Log Empty</h3>
                        <p className="text-slate-500 text-lg font-medium italic opacity-60">No platform agents found matching your search parameters.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
