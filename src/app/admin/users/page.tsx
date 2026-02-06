import connectDB from "@/lib/db";
import User from "@/models/User";
import { UserManagementView } from "@/components/admin/UserManagementView";
import { Users as UsersIcon, ShieldCheck } from "lucide-react";

async function getUsers() {
    await connectDB();
    const users = await User.find({}).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(users));
}

export default async function AdminUsersPage() {
    const users = await getUsers();

    return (
        <div className="relative pb-24">
            {/* Standardized Header */}
            <header className="sticky top-0 z-[60] bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <UsersIcon className="w-6 h-6 text-indigo-500" />
                            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                                User <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Management</span>
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 bg-white/[0.03] border border-white/5 px-5 py-2.5 rounded-2xl backdrop-blur-md">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Sync: Active</span>
                        </div>
                        <div className="bg-indigo-600/10 border border-indigo-500/20 px-6 py-2.5 rounded-2xl shadow-xl shadow-indigo-600/5 transition-all hover:bg-indigo-500/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="block text-[8px] font-black text-indigo-500/60 uppercase tracking-widest leading-none mb-1">Total Agents</span>
                                    <span className="block text-xl font-black text-white leading-none tabular-nums">{users.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-indigo-600/[0.03] blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-purple-600/[0.02] blur-[120px] rounded-full" />
            </div>

            <main className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
                <div className="mb-12">
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-4 italic">PERSONNEL <span className="text-indigo-500">RECORDS</span></h2>
                    <p className="text-slate-400 font-medium text-lg leading-relaxed opacity-80 italic max-w-2xl">
                        Coordinate platform access, assign operational roles, and maintain system integrity through comprehensive PERSONNEL oversight.
                    </p>
                </div>

                <UserManagementView initialUsers={users} />
            </main>
        </div>
    );
}
