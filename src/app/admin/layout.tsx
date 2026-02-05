import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex h-screen bg-background text-white">
            <AdminSidebar />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-[url('/grid-pattern.svg')] bg-fixed relative">
                <div className="absolute inset-0 bg-background/90 pointer-events-none" />
                <div className="relative z-10 p-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
