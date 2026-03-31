import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Arena from "@/models/Arena";
import SubAdminConfig from "@/models/SubAdminConfig";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Fetch Sub-Admin Overview Stats
 */
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!session || (user.role !== 'subadmin' && user.role !== 'admin')) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        // 1. Associated Users Count
        const usersCount = await User.countDocuments({ assignedSubAdminId: user.id });
        
        // 2. Arenas Created Count
        const arenasCount = await Arena.countDocuments({ createdBy: user.id });
        
        // 3. Sub-Admin Config & Commission
        const config = await SubAdminConfig.findOne({ subAdminId: user.id });
        const commissionEarned = user.commissionEarned || 0;
        
        // 4. Recent Arenas (Last 5)
        const recentArenas = await Arena.find({ createdBy: user.id })
            .select('name entryFee slotsCount maxSlots status createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        return NextResponse.json({
            stats: {
                usersCount,
                arenasCount,
                commissionEarned,
                brandName: config?.brandName || "My Franchise",
                commissionPercentage: config?.commissionPercentage || 5
            },
            recentArenas
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
