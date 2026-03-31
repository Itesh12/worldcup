import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!session || (user.role !== 'admin' && user.role !== 'subadmin')) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        let query: any = { role: 'user' };
        
        // Role-Based Scoping: Sub-admins only see their assigned users
        if (user.role === 'subadmin') {
            query = { ...query, assignedSubAdminId: user.id };
        }

        // Exclude password, only fetch regular users
        const users = await User.find(query)
            .select('name email walletBalance createdAt')
            .sort({ createdAt: -1 });

        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
