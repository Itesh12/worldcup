
"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { Upload, X, Loader2 } from "lucide-react";

interface ImageUploadProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
}

export function ImageUpload({ value, onChange, label = "Profile Image" }: ImageUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState(value);

    // Sync preview with value prop changes
    useEffect(() => {
        setPreview(value);
    }, [value]);

    const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        // setPreview(URL.createObjectURL(file)); // Don't set preview strictly here, wait for real upload or keep it for immediate feedback?
        // Better to keep immediate feedback for UX, but onChange will eventually update value -> effect updates preview.
        // Actually, if we rely on effect, we get the real path. If we rely on blob, we get fast feedback.
        // Let's use blob for immediate but if upload fails we revert.
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            onChange(data.path);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload image.");
            setPreview(value); // Revert to original value
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = () => {
        onChange("");
        setPreview(undefined);
    };

    return (
        <div className="space-y-2">
            {label && <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>}
            <div className={`relative flex items-center justify-center w-32 h-32 rounded-full bg-slate-900 overflow-hidden group transition-colors mx-auto ${isLoading ? "opacity-50" : ""}`}>
                <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer relative z-10">
                    {preview ? (
                        <>
                            <img src={preview} alt="Upload" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center">
                            <Upload className="w-6 h-6 text-slate-500 mb-2" />
                            <span className="text-xs text-slate-500 font-medium">Upload</span>
                        </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isLoading} />
                </label>

                {preview && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault(); // Prevent label click
                            handleRemove();
                        }}
                        className="absolute top-2 right-2 z-20 w-6 h-6 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}

                {isLoading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
}
