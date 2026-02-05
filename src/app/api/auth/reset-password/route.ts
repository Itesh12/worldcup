
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        const { email, code, newPassword } = await req.json();

        if (!email || !code || !newPassword) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (!user.passwordResetCode || user.passwordResetCode !== code) {
            return NextResponse.json({ message: "Invalid reset code" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await User.findByIdAndUpdate(user._id, {
            password: hashedPassword,
            passwordResetCode: null // Clear the code after use
        });

        return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
