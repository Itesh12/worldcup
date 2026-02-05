
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: { name: string; image: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return { success: false, message: "Unauthorized" };
        }

        await connectDB();

        const user = await User.findById((session.user as any).id);
        if (!user) {
            return { success: false, message: "User not found" };
        }

        user.name = data.name;
        user.image = data.image; // Base64 string from client
        await user.save();

        revalidatePath("/"); // Update all pages
        return { success: true };
    } catch (error: any) {
        console.error("Profile update error:", error);
        return { success: false, message: error.message };
    }
}
