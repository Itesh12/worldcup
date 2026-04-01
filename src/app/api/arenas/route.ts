import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import Match from "@/models/Match";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import crypto from 'crypto';

/**
 * Handle Arena Creation & Listing
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const matchId = searchParams.get('matchId');

        if (!matchId) {
            return NextResponse.json({ message: "MatchId is required" }, { status: 400 });
        }

        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        // Fetch open public arenas for this match
        const arenas = await Arena.find({ 
            matchId, 
            $or: [
                { isPrivate: false },
                { createdBy: userId }
            ],
            status: { $in: ['open', 'full'] }
        })
        .populate('createdBy', 'name')
        .sort({ entryFee: 1 })
        .lean();

        // 3. If logged in, cross-reference with UserBattingAssignment
        let userAssignments: any[] = [];
        if (userId) {
            userAssignments = await UserBattingAssignment.find({
                matchId,
                userId
            }).select('arenaId').lean();
        }

        const joinedArenaIds = new Set(userAssignments.map(a => a.arenaId.toString()));

        const enhancedArenas = arenas.map((arena: any) => ({
            ...arena,
            hasJoined: joinedArenaIds.has(arena._id.toString())
        }));

        return NextResponse.json(enhancedArenas);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as any;
        const { 
            matchId, 
            name, 
            entryFee, 
            maxSlots, 
            isPrivate, 
            description,
            adminCommissionPercentage,
            organizerCommissionPercentage 
        } = await req.json();

        if (!matchId || !name) {
            return NextResponse.json({ message: "MatchId and Name are required" }, { status: 400 });
        }

        await connectDB();

        // 1. Fetch Match to calculate revealTime
        const match = await Match.findById(matchId);
        if (!match) {
            return NextResponse.json({ message: "Match not found" }, { status: 404 });
        }

        const matchStartTime = new Date(match.startTime);
        const revealTime = new Date(matchStartTime.getTime() - 30 * 60 * 1000);

        // 2. Generate Invite Code for Private Arenas
        let inviteCode = undefined;
        if (isPrivate) {
            inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
        }

        // 3. Create Arena
        // Validation: maxSlots must be even and between 2 and 10, default 8
        let finalMaxSlots = maxSlots || 8;
        if (finalMaxSlots % 2 !== 0) finalMaxSlots += 1;
        if (finalMaxSlots > 10) finalMaxSlots = 10;
        if (finalMaxSlots < 2) finalMaxSlots = 2;

        const arena = await Arena.create({
            matchId,
            tournamentId: match.tournamentId,
            createdBy: user.id,
            name,
            description,
            entryFee: Number(entryFee) || 0,
            maxSlots: finalMaxSlots,
            isPrivate: !!isPrivate,
            inviteCode,
            revealTime,
            // Commission Logic from Request (validated by role)
            adminCommissionPercentage: user.role === 'admin' 
                ? (adminCommissionPercentage || match.commissionPercentage || 5)
                : (match.commissionPercentage || 5),
            organizerCommissionPercentage: user.role === 'subadmin' || user.role === 'admin'
                ? (organizerCommissionPercentage || 0)
                : (user.role === 'user' ? 2 : 0) // Users get 2% host incentive
        });

        return NextResponse.json({
            message: "Arena created successfully",
            arena
        });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ message: "Invite code collision. Please try again." }, { status: 409 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
