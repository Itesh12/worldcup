import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { matchId, userId, inningsNumber, position } = await req.json();

        if (!matchId || !userId || !inningsNumber || !position) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        await connectDB();

        // Update or create assignment
        const assignment = await UserBattingAssignment.findOneAndUpdate(
            { matchId, inningsNumber, position },
            { userId },
            { upsert: true, new: true }
        );

        return NextResponse.json({ message: "User assigned successfully", assignment });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ message: "MatchID required" }, { status: 400 });
        }

        await connectDB();
        const assignments = await UserBattingAssignment.find({ matchId }).populate('userId', 'name email');

        return NextResponse.json(assignments);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const assignmentId = searchParams.get('id');

        console.log("Attempting to delete assignment:", assignmentId);

        if (!assignmentId) {
            return NextResponse.json({ message: "Assignment ID required" }, { status: 400 });
        }

        await connectDB();
        const deleted = await UserBattingAssignment.findByIdAndDelete(assignmentId);
        console.log("Deletion result:", deleted ? "Success" : "Not Found");

        return NextResponse.json({ message: "Assignment removed", success: !!deleted });
    } catch (error: any) {
        console.error("Delete handler error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
