import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import SubAdminConfig from "@/models/SubAdminConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Handle Sub-Admin Management (Main Admin Only)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!session || user.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        // Fetch all sub-admins and their configs
        const subAdmins = await User.find({ role: 'subadmin' })
            .select('name email commissionEarned')
            .lean();
            
        const configs = await SubAdminConfig.find().lean();
        
        const combined = subAdmins.map((sa: any) => ({
            ...sa,
            config: configs.find(c => c.subAdminId.toString() === sa._id.toString())
        }));

        return NextResponse.json(combined);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!session || user.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { userId, brandName, commissionPercentage } = await req.json();

        if (!userId || !brandName) {
            return NextResponse.json({ message: "UserId and BrandName are required" }, { status: 400 });
        }

        await connectDB();

        // 1. Promote User to Sub-Admin
        const promotedUser = await User.findByIdAndUpdate(
            userId,
            { role: 'subadmin', parentAdminId: user.id },
            { new: true }
        );

        if (!promotedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // 2. Create or Update Config
        const config = await SubAdminConfig.findOneAndUpdate(
            { subAdminId: userId },
            { 
                brandName, 
                commissionPercentage: commissionPercentage || 5,
                allowedToCreateArenas: true 
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({
            message: "Sub-Admin promoted successfully",
            user: promotedUser,
            config
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
