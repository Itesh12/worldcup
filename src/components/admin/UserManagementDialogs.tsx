
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Edit, Ban, CheckCircle, Trash2, X, BadgeAlert, AlertTriangle, Loader2, Key, User as UserIcon, Shield, Mail } from "lucide-react";
import { updateUser, toggleBanUser, deleteUser, generateResetCode } from "@/app/admin/users/actions";
import { ImageUpload } from "@/components/ImageUpload";

import { useRouter } from "next/navigation";

interface UserManagementProps {
    user: {
        _id: string;
        name: string;
        email: string;
        role: string;
        isBanned: boolean;
        image?: string;
    };
}

export function UserManagementDialogs({ user }: UserManagementProps) {
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
        image: user.image || ""
    });

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await updateUser(user._id, formData);
        router.refresh();
        setIsLoading(false);
        setIsEditOpen(false);
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

    return (
        <>
            {/* --- Action Buttons --- */}
            <div className="flex items-center justify-end gap-1">
                <button
                    onClick={handleGenerateCode}
                    disabled={isLoading}
                    className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                    title="Reset Password"
                >
                    <Key className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={() => setIsEditOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                    title="Edit User"
                >
                    <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                    onClick={() => setIsBanOpen(true)}
                    className={`p-1.5 rounded-lg transition-all ${user.isBanned
                        ? "text-green-500 hover:bg-green-500/10"
                        : "text-orange-500 hover:bg-orange-500/10"
                        }`}
                    title={user.isBanned ? "Unban User" : "Ban User"}
                >
                    {user.isBanned ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                </button>

                <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete User"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* --- Edit Dialog --- */}
            {isEditOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/20">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                                        <Edit className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    Edit User Profile
                                </h3>
                            </div>
                            <button onClick={() => setIsEditOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-shrink-0">
                                    <ImageUpload
                                        value={formData.image}
                                        onChange={(val) => setFormData({ ...formData, image: val })}
                                        label="AVATAR"
                                    />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 px-1">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-slate-950 transition-all"
                                            placeholder="Enter name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 px-1">
                                            Email Address <span className="opacity-40 normal-case ml-1 font-medium">(Locked)</span>
                                        </label>
                                        <div className="w-full bg-slate-950/30 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-slate-500 font-bold select-none flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 opacity-50" />
                                            {formData.email}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 px-1">Platform Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="user">User (Standard Access)</option>
                                            <option value="admin">Admin (Systems Access)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="px-5 py-2.5 text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save Profile"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* --- Ban Dialog --- */}
            {isBanOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 pointer-events-auto">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 active:scale-95 transition-transform ${user.isBanned
                                ? "bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]"
                                : "bg-orange-500/10 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
                                }`}>
                                {user.isBanned ? <CheckCircle className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                            </div>
                            <h3 className="text-xl font-black text-white px-4 leading-tight">
                                {user.isBanned ? "Restore User Access?" : "Restrict User Access?"}
                            </h3>
                            <p className="mt-3 text-slate-400 text-xs font-medium px-4 leading-relaxed">
                                {user.isBanned
                                    ? `Confirm you want to unban ${user.name}. They will regain full access to their dashboard.`
                                    : `Confirm the restriction for ${user.name}. They will be immediately blocked from the platform.`
                                }
                            </p>
                            <div className="mt-8 flex gap-3 w-full p-2">
                                <button
                                    onClick={() => setIsBanOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleBanToggle}
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-white shadow-lg ${user.isBanned
                                        ? "bg-green-600 hover:bg-green-500 shadow-green-600/20"
                                        : "bg-orange-600 hover:bg-orange-500 shadow-orange-600/20"
                                        }`}
                                >
                                    {isLoading ? "Wait..." : (user.isBanned ? "Unban" : "Confirm Ban")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- Delete Dialog --- */}
            {isDeleteOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-white px-4">Permanent Deletion?</h3>
                            <p className="mt-3 text-slate-400 text-xs font-medium px-4 leading-relaxed">
                                You are about to remove <strong>{user.name}</strong>. All associated data will be erased forever. This cannot be undone.
                            </p>
                            <div className="mt-8 flex gap-3 w-full p-2">
                                <button
                                    onClick={() => setIsDeleteOpen(false)}
                                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20"
                                >
                                    {isLoading ? "Deleting..." : "Delete Permanently"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* --- Reset Code Dialog --- */}
            {resetCode && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-6 flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                                <Key className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-white px-4">Reset Security Code</h3>
                            <p className="mt-3 text-slate-400 text-xs font-medium px-4 leading-relaxed">
                                Share this temporary code with <strong>{user.name}</strong>. It allows them to bypass the current login.
                            </p>

                            <div className="mt-6 w-full bg-slate-950/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2">Temporary Access Code</span>
                                <span className="text-3xl font-black text-indigo-400 tracking-[0.4em] mb-1">{resetCode}</span>
                            </div>

                            <button
                                onClick={() => setResetCode(null)}
                                className="mt-8 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
