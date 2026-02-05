
"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, LogOut, User as UserIcon, Mail, Camera, Loader2, Save, Edit2 } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./ImageUpload";
import { updateProfile } from "@/app/actions/profile";

interface ProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

export function ProfileDialog({ isOpen, onClose, user }: ProfileDialogProps) {
    const { update } = useSession(); // Get update function
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user.name || "",
        image: user.image || "",
    });
    const router = useRouter();

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await updateProfile({
                name: formData.name,
                image: formData.image
            });

            if (res.success) {
                // Update client session immediately
                await update({ name: formData.name, image: formData.image });

                router.refresh();
                setIsEditing(false);
            } else {
                alert(res.message || "Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#050B14] border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900" />
                <div className="absolute top-0 left-0 w-full h-32 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-overlay" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors backdrop-blur-md"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="relative pt-16 px-6 pb-8 flex flex-col items-center">
                    {isEditing ? (
                        <div className="w-full space-y-6 animate-in slide-in-from-bottom-5">
                            <div className="flex justify-center mb-2">
                                <div className="p-1 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl shadow-indigo-900/40">
                                    <div className="bg-[#050B14] rounded-full overflow-hidden">
                                        <ImageUpload
                                            value={formData.image}
                                            onChange={(val) => setFormData({ ...formData, image: val })}
                                            label=""
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                                    <input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="space-y-2 opacity-50 pointer-events-none">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Email</label>
                                    <input
                                        value={user.email || ""}
                                        readOnly
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-5">
                            {/* Avatar Display */}
                            <div className="relative mb-6 group">
                                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-xl shadow-indigo-900/40">
                                    <div className="w-full h-full rounded-full bg-[#050B14] overflow-hidden flex items-center justify-center relative">
                                        {formData.image ? (
                                            <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-4xl font-black text-white">{user.name?.[0]}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-white mb-1">{user.name}</h2>
                            <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-6">
                                {user.role || "User"}
                            </p>

                            <div className="w-full space-y-3">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address</p>
                                        <p className="text-sm font-bold text-white truncate">{user.email}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:bg-slate-800 hover:border-white/10 transition-all group"
                                >
                                    <Edit2 className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-white text-sm">Edit Profile</span>
                                </button>

                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/10 hover:bg-red-500/20 hover:border-red-500/20 transition-all group mt-2"
                                >
                                    <LogOut className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                                    <span className="font-bold text-red-500 text-sm">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
