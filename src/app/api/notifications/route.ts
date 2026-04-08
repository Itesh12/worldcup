import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Notification from "@/models/Notification";

/**
 * GET: Fetch latest 20 notifications for the authenticated user
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        const notifications = await Notification.find({ userId: (session.user as any).id })
            .sort({ createdAt: -1 })
            .limit(20);
            
        return NextResponse.json(notifications);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

/**
 * POST: Mark all notifications as read for the authenticated user
 */
export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        await Notification.updateMany(
            { userId: (session.user as any).id, isRead: false },
            { isRead: true }
        );
            
        return NextResponse.json({ message: "All notifications marked as read" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
