
import connectDB from "@/lib/db";
import User from "@/models/User";
import { UserManagementDialogs } from "@/components/admin/UserManagementDialogs";
import { Users as UsersIcon, ShieldCheck, UserPlus, Clock, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

async function getUsers() {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(users)); // Serialize for client component access
}

export default async function AdminUsersPage() {
    const users = await getUsers();

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 relative pb-10">
            {/* Standardized Header */}
            <header className="sticky top-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between font-sans">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <UsersIcon className="w-6 h-6 text-indigo-500" />
                            <h1 className="text-xl font-black text-white tracking-tight">USER <span className="text-indigo-500">MANAGEMENT</span></h1>
                        </div>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/20 px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all hover:bg-indigo-500/10">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/10">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                            <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Total Database</span>
                            <span className="block text-lg font-black text-white leading-none">{users.length}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Subtler Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="max-w-7xl mx-auto px-4 pt-12 relative z-10">
                <p className="text-slate-500 text-sm font-medium">Coordinate platform access, assign roles, and maintain safety.</p>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8">
                <div className="relative z-10 bg-slate-950/20 backdrop-blur-xl rounded-[32px] border border-white/5 overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-950/40 border-b border-white/5">
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Identity Profile</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Access Level</th>
                                    <th className="px-6 py-4 text-left text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Registered</th>
                                    <th className="px-6 py-4 text-right text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {users.map((user: any) => (
                                    <tr
                                        key={user._id}
                                        className={`transition-all duration-200 group ${user.isBanned
                                            ? "bg-red-500/[0.02] grayscale-[0.4]"
                                            : "hover:bg-white/[0.02]"
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-xl overflow-hidden transition-all duration-300 group-hover:scale-105 ${user.isBanned
                                                        ? "bg-slate-800 text-slate-500"
                                                        : "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-indigo-600/10 border border-white/10"
                                                        }`}>
                                                        {user.image ? (
                                                            <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            user.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    {!user.isBanned && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-slate-950 rounded-full shadow-sm" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <div className={`text-sm font-black tracking-tight transition-colors truncate ${user.isBanned ? "text-slate-500 line-through" : "text-white group-hover:text-indigo-400"
                                                            }`}>
                                                            {user.name}
                                                        </div>
                                                        {user.isBanned && (
                                                            <span className="px-1.5 py-0.5 rounded bg-red-600/10 border border-red-500/20 text-red-500 text-[7px] font-black uppercase tracking-widest">
                                                                Restricted
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold tracking-wide truncate">
                                                        <Mail className="w-2.5 h-2.5 text-indigo-500/40" /> {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${user.role === 'admin'
                                                ? 'bg-purple-600/5 text-purple-400 border-purple-500/20'
                                                : 'bg-indigo-600/5 text-indigo-400 border-indigo-500/20'
                                                }`}>
                                                <div className={`w-1 h-1 rounded-full ${user.role === 'admin' ? 'bg-purple-400' : 'bg-indigo-400'}`} />
                                                {user.role}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                                    <Clock className="w-2.5 h-2.5 opacity-50" /> Joined
                                                </span>
                                                <span className="text-xs font-bold text-slate-400">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end opacity-40 group-hover:opacity-100 transition-opacity">
                                                <UserManagementDialogs user={user} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Empty State */}
                {users.length === 0 && (
                    <div className="relative z-10 text-center py-24 bg-slate-950/20 border border-dashed border-white/5 rounded-[32px] backdrop-blur-md">
                        <UserPlus className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-30" />
                        <h3 className="text-lg font-black text-white mb-1 tracking-tight">No Users Available</h3>
                        <p className="text-slate-500 text-sm font-medium italic">Database currently contains 0 registration records.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
