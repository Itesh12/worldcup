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
            {/* Header is now at Layout Level */}

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
