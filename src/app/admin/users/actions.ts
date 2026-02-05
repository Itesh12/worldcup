
"use server";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function toggleBanUser(userId: string, currentStatus: boolean) {
    try {
        await connectDB();
        await User.findByIdAndUpdate(userId, { isBanned: !currentStatus });
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle ban status:", error);
        return { success: false, error: "Failed to update ban status" };
    }
}

export async function deleteUser(userId: string) {
    try {
        await connectDB();
        await User.findByIdAndDelete(userId);
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}

export async function updateUser(userId: string, data: { name: string; role: string; email: string; image?: string }) {
    try {
        await connectDB();
        await User.findByIdAndUpdate(userId, data);
        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Failed to update user" };
    }
}

export async function generateResetCode(userId: string) {
    try {
        await connectDB();
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
        await User.findByIdAndUpdate(userId, { passwordResetCode: code });
        revalidatePath("/admin/users");
        return { success: true, code };
    } catch (error) {
        console.error("Failed to generate code:", error);
        return { success: false, error: "Failed to generate reset code" };
    }
}
