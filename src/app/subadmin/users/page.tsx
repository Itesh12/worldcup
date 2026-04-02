"use client";

import React, { useEffect, useState } from "react";
import { 
    Users as UsersIcon, 
    ShieldCheck, 
    Search,
    RefreshCw
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { Spinner } from "@/components/ui/Spinner";
import { SubAdminUserView } from "@/components/subadmin/SubAdminUserView";

export default function SubAdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { showToast } = useToast();
    
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/subadmin/users");
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            showToast("Failed to sync personnel records", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const role = (session?.user as any)?.role;
            if (role !== "subadmin" && role !== "admin") {
                router.push("/dashboard");
            } else {
                fetchUsers();
            }
        }
    }, [status, session]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Spinner />
                <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing Personnel Grid...</p>
            </div>
        );
    }

    return (
        <div className="relative pb-24">
            {/* Header is now at Layout Level */}

            {/* Ambient Background Glow (Mirrored from Admin) */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[400px] md:w-[800px] h-[300px] md:h-[600px] bg-purple-600/[0.03] blur-[100px] md:blur-[150px] rounded-full" />
            </div>

            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10 relative z-10">
                <p className="text-slate-400 font-medium text-sm md:text-base italic opacity-80 mb-6 md:mb-10 max-w-2xl leading-relaxed">
                    Coordinate platform access, audit personnel status, and maintain franchise operational integrity.
                </p>

                <SubAdminUserView initialUsers={users} />
            </main>
        </div>
    );
}
