import connectDB from "@/lib/db";
import User from "@/models/User";
import { UserManagementView } from "@/components/admin/UserManagementView";
import { Users as UsersIcon, ShieldCheck } from "lucide-react";
import mongoose from "mongoose";

async function getUsers() {
    await connectDB();
    const users = await User.find({})
        .populate('assignedSubAdminId', 'name')
        .sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(users));
}

async function getSubAdmins() {
    await connectDB();
    const SubAdminConfig = mongoose.models.SubAdminConfig || mongoose.model('SubAdminConfig', new mongoose.Schema({
        subAdminId: mongoose.Schema.Types.ObjectId,
        brandName: String
    }));
    
    const subAdmins = await User.find({ role: 'subadmin' }).select('name _id').sort({ name: 1 });
    const configs = await SubAdminConfig.find({ subAdminId: { $in: subAdmins.map(sa => sa._id) } });

    // Combine
    const subAdminsWithBrand = subAdmins.map(sa => {
        const config = configs.find(c => c.subAdminId.toString() === sa._id.toString());
        return {
            _id: sa._id,
            name: sa.name,
            brandName: config?.brandName || "Platform"
        };
    });

    return JSON.parse(JSON.stringify(subAdminsWithBrand));
}

export default async function AdminUsersPage() {
    const users = await getUsers();
    const subAdmins = await getSubAdmins();

    return (
        <div className="relative pb-24">
            {/* Standardized Premium Header */}
            <header className="sticky top-0 z-[60] bg-[#050B14]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                <UsersIcon className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h1 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                                    User <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Management</span>
                                </h1>
                                <p className="text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 hidden xs:block">
                                    Personnel Records
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 bg-white/[0.03] border border-white/5 px-4 py-2 rounded-xl backdrop-blur-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Sync</span>
                            </div>
                            
                            <div className="flex items-center gap-2 md:gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-2xl shrink-0">
                                <div className="w-6 h-6 md:w-8 md:h-8 rounded-[8px] md:rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/20">
                                    <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <span className="text-[8px] md:text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Agents</span>
                                    <span className="text-base md:text-lg font-black text-white leading-none tabular-nums">{users.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Ambient Background Glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[300px] md:h-[600px] bg-indigo-600/[0.03] blur-[100px] md:blur-[150px] rounded-full" />
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 relative z-10">
                <p className="text-slate-400 font-medium text-sm md:text-base italic opacity-80 mb-6 md:mb-10 max-w-2xl">
                    Coordinate platform access, assign operational roles, and maintain system integrity.
                </p>

                <UserManagementView initialUsers={users} subAdmins={subAdmins} />
            </main>
        </div>
    );
}
