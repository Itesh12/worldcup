import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Tournament from "@/models/Tournament";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const tournaments = await Tournament.find().sort({ createdAt: -1 });

        return NextResponse.json(tournaments);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, cricbuzzSeriesId, cricbuzzSlug, isActive, commissionPercentage } = body;

        await connectDB();

        const tournament = await Tournament.create({
            name, cricbuzzSeriesId, cricbuzzSlug, isActive, commissionPercentage
        });

        return NextResponse.json(tournament, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { id, isActive } = body;

        if (!id) {
            return NextResponse.json({ message: "ID required" }, { status: 400 });
        }

        await connectDB();

        const tournament = await Tournament.findByIdAndUpdate(id, { isActive }, { new: true });

        return NextResponse.json(tournament);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
