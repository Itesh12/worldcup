
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { 
    Edit, Ban, CheckCircle, Trash2, X, BadgeAlert, 
    AlertTriangle, Loader2, Key, User as UserIcon, 
    Shield, Mail, ShieldCheck, MousePointer2, Activity, Trophy
} from "lucide-react";
import { updateUser, toggleBanUser, deleteUser, generateResetCode } from "@/app/admin/users/actions";
import { updateSubAdminConfigByAdmin } from "@/app/actions/subadmin";
import { ImageUpload } from "@/components/ImageUpload";
import { CustomDropdown } from "./CustomDropdown";
import { useRouter } from "next/navigation";

interface UserManagementProps {
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
        isBanned: boolean;
        image?: string;
        lastLogin?: string;
        assignedSubAdminId?: {
            _id: string;
            name: string;
        };
    };
    subAdmins: { _id: string; name: string, brandName?: string }[];
}

export function UserManagementDialogs({ user, subAdmins }: UserManagementProps) {
    const router = useRouter();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isBanOpen, setIsBanOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resetCode, setResetCode] = useState<string | null>(null);

    // Edit Form State
    const [formData, setFormData] = useState({
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image || "",
        assignedSubAdminId: user.assignedSubAdminId?._id || "",
        brandName: subAdmins.find(sa => sa._id === user._id)?.brandName || ""
    });

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const res = await updateUser(user._id, formData);
        
        // If it's a subadmin, also update their config
        if (formData.role === 'subadmin') {
            await updateSubAdminConfigByAdmin(user._id, { brandName: formData.brandName });
        }

        if (res.success) {
            router.refresh();
            setIsEditOpen(false);
        }
        setIsLoading(false);
    };

    const handleBanToggle = async () => {
        setIsLoading(true);
        await toggleBanUser(user._id, user.isBanned);
        router.refresh();
        setIsLoading(false);
        setIsBanOpen(false);
    };

    const handleGenerateCode = async () => {
        setIsLoading(true);
        const res = await generateResetCode(user._id);
        setIsLoading(false);
        if (res.success && res.code) {
            setResetCode(res.code);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        await deleteUser(user._id);
        router.refresh();
        setIsLoading(false);
        setIsDeleteOpen(false);
    };

    const roleOptions = [
        { id: "user", label: "User", subLabel: "Standard platform access", icon: UserIcon },
        { id: "player", label: "Player", subLabel: "Contest participation access", icon: Trophy },
        { id: "subadmin", label: "Sub-Admin", subLabel: "Franchise management access", icon: Shield },
    ];

    const subAdminOptions = [
        { id: "", label: "None (Unassigned)", icon: X },
        ...subAdmins.map(sa => ({
            id: sa._id,
            label: sa.name,
            subLabel: sa.brandName || "Platform Franchise",
            badge: sa.brandName
        }))
    ];

    return (
        <>
            {/* --- Action Buttons --- */}
            <div className="flex items-center justify-end gap-1">
                <button
                    onClick={handleGenerateCode}
                    disabled={isLoading}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all active:scale-95"
                    title="Reset Password"
                >
                    <Key className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all active:scale-95"
                    title="Edit User"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={() => setIsBanOpen(true)}
                    className={`p-1.5 rounded-lg transition-all active:scale-95 ${user.isBanned
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-orange-500 hover:bg-orange-500/10"
                        }`}
                    title={user.isBanned ? "Unban User" : "Ban User"}
                >
                    {user.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                </button>

                <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all active:scale-95"
                    title="Delete User"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* --- PREMIUM Edit Dialog --- */}
            {isEditOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0A0F1C] border border-white/10 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="px-8 py-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                    <Edit className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none">
                                        Edit <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Agent Profile</span>
                                    </h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1.5">Administrative Records Update</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditOpen(false)} className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                                {/* Left: Avatar & Activity */}
                                <div className="md:col-span-4 flex flex-col items-center gap-8 border-r border-white/5 pr-4">
                                    <ImageUpload
                                        value={formData.image}
                                        onChange={(val) => setFormData({ ...formData, image: val })}
                                        label="AVATAR"
                                    />
                                    <div className="w-full space-y-4">
                                        <div className="p-5 rounded-[32px] bg-white/[0.02] border border-white/5 shadow-inner">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Activity className="w-3 h-3 text-indigo-400" />
                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Activity Digest</span>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div>
                                                    <span className="block text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Current State</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${user.isBanned ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]'}`} />
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${user.isBanned ? 'text-red-400' : 'text-green-400'}`}>
                                                            {user.isBanned ? 'Restricted' : 'Active Duty'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div>
                                                    <span className="block text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Last Deployment</span>
                                                    <p 
                                                        className="text-[11px] font-bold text-slate-400 leading-tight"
                                                        suppressHydrationWarning
                                                    >
                                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-GB') : "First Mission Pending"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Input Fields */}
                                <div className="md:col-span-8 space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-1">Agent Identity</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-[#050810] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-sm text-white font-bold placeholder:text-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-xl"
                                                placeholder="Enter operative name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-1 flex items-center justify-between">
                                            <span>Communication Channel</span>
                                            <span className="text-[8px] text-indigo-400 normal-case italic opacity-40">System Locked Identity</span>
                                        </label>
                                        <div className="w-full bg-slate-950/20 border border-white/5 rounded-2xl px-5 py-4 text-sm text-slate-600 font-bold select-none cursor-not-allowed flex items-center gap-3">
                                            <Mail className="w-4 h-4 opacity-20" />
                                            {formData.email}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <CustomDropdown
                                            label="Service Role"
                                            options={roleOptions}
                                            value={formData.role}
                                            onChange={(val) => setFormData({ ...formData, role: val })}
                                            icon={ShieldCheck}
                                        />

                                        {(formData.role === 'user' || formData.role === 'player') && (
                                            <CustomDropdown
                                                label="Linked Franchise"
                                                options={subAdminOptions}
                                                value={formData.assignedSubAdminId}
                                                onChange={(val) => setFormData({ ...formData, assignedSubAdminId: val })}
                                                icon={MousePointer2}
                                                placeholder="Assign Sub-Admin"
                                            />
                                        )}

                                        {formData.role === 'subadmin' && (
                                            <div className="relative">
                                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 px-1 flex items-center gap-2 italic">
                                                    <Trophy className="w-3 h-3" /> Franchise Brand Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.brandName}
                                                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                                                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm text-white font-bold placeholder:text-slate-800 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-xl"
                                                    placeholder="e.g. My Franchise"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-end items-center gap-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-8 py-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white transition-all order-2 sm:order-1 active:scale-95"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-4 shadow-[0_15px_35px_rgba(79,70,229,0.25)] hover:shadow-indigo-500/40 disabled:opacity-50 order-1 sm:order-2 active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>
                                            Commit Records
                                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3" />
                                            </div>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* --- BAN DIALOG --- */}
            {isBanOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0F1421] border border-white/10 w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 shadow-2xl ${user.isBanned
                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                }`}>
                                {user.isBanned ? <CheckCircle className="w-8 h-8" /> : <Shield className="w-8 h-8" />}
                            </div>
                            <h3 className="text-2xl font-black text-white leading-tight uppercase italic tracking-tight">
                                {user.isBanned ? "Restore Access?" : "Restrict Agent?"}
                            </h3>
                            <p className="mt-4 text-slate-500 text-xs font-bold px-4 leading-relaxed uppercase tracking-widest opacity-60">
                                Operative: {user.name}
                            </p>
                            <div className="mt-10 flex gap-4 w-full">
                                <button
                                    onClick={() => setIsBanOpen(false)}
                                    className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBanToggle}
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-white shadow-xl active:scale-95 ${user.isBanned
                                        ? "bg-green-600 hover:bg-green-500 shadow-green-600/20"
                                        : "bg-orange-600 hover:bg-orange-500 shadow-orange-600/20"
                                        }`}
                                >
                                    {isLoading ? "Wait..." : "Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- DELETE DIALOG --- */}
            {isDeleteOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0F1421] border border-white/10 w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-[24px] bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mb-6 shadow-2xl">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-white px-4 uppercase italic tracking-tight">Erase Operative?</h3>
                            <p className="mt-4 text-slate-400 text-xs font-bold leading-relaxed">
                                You are about to permanently remove <span className="text-white">{user.name}</span>. This action is terminal and irreversible.
                            </p>
                            <div className="mt-10 flex gap-4 w-full">
                                <button
                                    onClick={() => setIsDeleteOpen(false)}
                                    className="flex-1 px-4 py-4 bg-white/5 hover:bg-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95"
                                >
                                    Abort
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-red-600/20 active:scale-95"
                                >
                                    {isLoading ? "Erasing..." : "Erase Data"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- RESET CODE DIALOG --- */}
            {resetCode && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#0F1421] border border-white/10 w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-[24px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-6 shadow-2xl">
                                <Key className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-black text-white px-4 uppercase italic tracking-tight">Security Bypass</h3>
                            <p className="mt-4 text-slate-400 text-xs font-medium px-4 leading-relaxed tracking-wider opacity-70">
                                Temporary authorization generated for operative <span className="text-indigo-400 font-black italic">{user.name}</span>.
                            </p>

                            <div className="mt-8 w-full bg-slate-950/50 border border-white/5 rounded-[32px] p-6 flex flex-col items-center shadow-inner">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 leading-none underline decoration-indigo-500/30 underline-offset-4">One-Time Token</span>
                                <span className="text-4xl font-black text-indigo-400 tracking-[0.5em] mb-1 tabular-nums">{resetCode}</span>
                            </div>

                            <button
                                onClick={() => setResetCode(null)}
                                className="mt-10 w-full px-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
                            >
                                Secure & Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
