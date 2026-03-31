import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { SubAdminLayoutWrapper } from "@/components/subadmin/SubAdminLayoutWrapper";

export default async function SubAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session || ((session.user as any).role !== "subadmin" && (session.user as any).role !== "admin")) {
        redirect("/");
    }

    return (
        <SubAdminLayoutWrapper>
            {children}
        </SubAdminLayoutWrapper>
    );
}
