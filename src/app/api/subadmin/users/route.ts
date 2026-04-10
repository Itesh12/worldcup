import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== "subadmin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        // Fetch users assigned to this sub-admin
        const users = await User.find({ 
            assignedSubAdminId: (session.user as any).id,
            role: { $in: ['user', 'player'] } // Only normal users/players, not other admins/subadmins
        }).sort({ createdAt: -1 });

        return NextResponse.json(users);
    } catch (error: any) {
        console.error("Fetch SubAdmin Users Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
