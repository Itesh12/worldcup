"use server";

import connectDB from "@/lib/db";
import SubAdminConfig from "@/models/SubAdminConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

/**
 * Self-service: Update sub-admin brand name
 */
export async function updateSubAdminBrand(brandName: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "subadmin") {
            return { success: false, error: "Unauthorized" };
        }

        if (!brandName || brandName.trim().length < 2) {
            return { success: false, error: "Brand name must be at least 2 characters." };
        }

        await connectDB();
        await SubAdminConfig.findOneAndUpdate(
            { subAdminId: (session.user as any).id },
            { brandName: brandName.trim() },
            { upsert: true, new: true }
        );

        revalidatePath("/subadmin");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update brand name:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Master Admin: Update any sub-admin config
 */
export async function updateSubAdminConfigByAdmin(subAdminId: string, data: { brandName?: string; commissionPercentage?: number }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "admin") {
            return { success: false, error: "Unauthorized" };
        }

        await connectDB();
        
        const updateData: any = {};
        if (data.brandName !== undefined) updateData.brandName = data.brandName.trim();
        if (data.commissionPercentage !== undefined) updateData.commissionPercentage = data.commissionPercentage;

        await SubAdminConfig.findOneAndUpdate(
            { subAdminId },
            updateData,
            { upsert: true, new: true }
        );

        revalidatePath("/admin/users");
        revalidatePath("/subadmin");
        return { success: true };
    } catch (error: any) {
        console.error("Master Admin Update Failed:", error);
        return { success: false, error: error.message };
    }
}
