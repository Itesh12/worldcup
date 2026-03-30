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
        const { searchParams } = new URL(req.url);
        const tournamentId = searchParams.get('tournamentId') || undefined;

        console.log("Public Match Sync - Triggered by user:", session.user?.email, "Tournament:", tournamentId || "Active only");
        const result = await performMatchSync(tournamentId);

        return NextResponse.json({
            message: "Matches synced successfully",
            count: result.count
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
