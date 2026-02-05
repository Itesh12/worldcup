import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Match from "@/models/Match";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        await connectDB();

        // 1. Create Admin User
        const adminEmail = "admin@worldcup.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("admin123", 12);
            await User.create({
                name: "Super Admin",
                email: adminEmail,
                password: hashedPassword,
                role: "admin",
            });
        }

        // 2. Create Regular Test User
        const userEmail = "player@worldcup.com";
        const existingUser = await User.findOne({ email: userEmail });
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash("player123", 12);
            await User.create({
                name: "Test Player",
                email: userEmail,
                password: hashedPassword,
                role: "user",
            });
        }

        return NextResponse.json({ message: "Seed successful. Admin: admin@worldcup.com / admin123" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
