import { NextRequest, NextResponse } from "next/server";
import { getAvailableSeries } from "@/lib/cricbuzzScraper";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const series = await getAvailableSeries();
        return NextResponse.json(series);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
