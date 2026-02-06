import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminLayoutWrapper } from "@/components/admin/AdminLayoutWrapper";

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
        <AdminLayoutWrapper>
            {children}
        </AdminLayoutWrapper>
    );
}
