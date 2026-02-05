import { NextRequest, NextResponse } from "next/server";
import { performMatchSync } from "@/lib/matchSync";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        console.log("Public Match Sync - Triggered by user:", session.user?.email);
        const result = await performMatchSync();

        return NextResponse.json({
            message: "Matches synced successfully",
            count: result.count
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
