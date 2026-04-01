import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Arena from "@/models/Arena";
import Match from "@/models/Match";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import UserBattingAssignment from "@/models/UserBattingAssignment";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";
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
        const filter = searchParams.get('filter');

        let query: any = { 
            matchId, 
            status: { $in: ['open', 'full', 'locked', 'revealed'] }
        };

        if (filter === 'hosted') {
            if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
            query.createdBy = userId;
        } else {
            query.$or = [
                { isPrivate: false },
                { createdBy: userId }
            ];
            query.status = { $in: ['open', 'full'] };
        }

        await connectDB();
        const arenas = await Arena.find(query)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
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
            hasJoined: joinedArenaIds.has(arena._id.toString()),
            // Protect invite code for non-creators
            inviteCode: (userId && arena.createdBy._id.toString() === userId) ? arena.inviteCode : undefined
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
        const userRole = user.role || 'user';
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

        // 1. Fetch Match & User
        const match = await Match.findById(matchId);
        if (!match) return NextResponse.json({ message: "Match not found" }, { status: 404 });
        
        const currentUser = await User.findById(user.id);
        if (!currentUser) return NextResponse.json({ message: "User not found" }, { status: 404 });

        // Check if user has sufficient balance for auto-join (if private)
        const fee = Number(entryFee) || 0;
        if (isPrivate && currentUser.walletBalance < fee) {
            return NextResponse.json({ message: "Insufficient balance for private contest auto-join (₹" + fee + " required)" }, { status: 400 });
        }

        const matchStartTime = new Date(match.startTime);
        const revealTime = new Date(matchStartTime.getTime() - 30 * 60 * 1000);

        // 2. Generate Invite Code for Private Arenas
        let inviteCode = undefined;
        if (isPrivate) {
            inviteCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
        }

        let finalMaxSlots = maxSlots || 8;
        if (finalMaxSlots % 2 !== 0) finalMaxSlots += 1;
        if (finalMaxSlots > 10) finalMaxSlots = 10;
        if (finalMaxSlots < 2) finalMaxSlots = 2;

        const mongooseSession = await mongoose.startSession();
        mongooseSession.startTransaction();

        try {
            // 3. Create Arena
            const arena = await Arena.create([{
                matchId,
                tournamentId: match.tournamentId,
                createdBy: user.id,
                name,
                description,
                entryFee: fee,
                maxSlots: finalMaxSlots,
                isPrivate: !!isPrivate,
                inviteCode,
                revealTime,
                slotsCount: !!isPrivate ? 1 : 0, 
                adminCommissionPercentage: user.role === 'admin' 
                    ? (adminCommissionPercentage || match.commissionPercentage || 5)
                    : (match.commissionPercentage || 5),
                organizerCommissionPercentage: user.role === 'subadmin' || user.role === 'admin'
                    ? (organizerCommissionPercentage || 0)
                    : (user.role === 'user' ? 2 : 0)
            }], { session: mongooseSession });

            // 4. Auto-Join if Private
            if (isPrivate) {
                currentUser.walletBalance -= fee;
                await currentUser.save({ session: mongooseSession });

                await Transaction.create([{
                    userId: user.id,
                    amount: -fee,
                    type: 'bet_placed',
                    description: `Auto-Join Private Contest: ${name}`,
                    status: 'completed',
                    referenceId: arena[0]._id.toString()
                }], { session: mongooseSession });

                await UserBattingAssignment.create([{
                    tournamentId: match.tournamentId,
                    matchId: matchId,
                    arenaId: arena[0]._id,
                    userId: user.id,
                    inningsNumber: 1,
                    position: null
                }], { session: mongooseSession });
            }

            await mongooseSession.commitTransaction();
            return NextResponse.json({
                message: "Arena created successfully",
                arena: arena[0]
            });

        } catch (error: any) {
            await mongooseSession.abortTransaction();
            throw error;
        } finally {
            mongooseSession.endSession();
        }
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ message: "Invite code collision. Please try again." }, { status: 409 });
        }
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
