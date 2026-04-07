import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import UserBattingAssignment from '@/models/UserBattingAssignment';
import Match from '@/models/Match';
import Arena from '@/models/Arena';
import SlotScore from '@/models/SlotScore';

/**
 * GET /api/user/active-contests
 * Returns arenas the user has joined for matches which are currently LIVE,
 * including their position and current score for that position.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        // 1. Get all user assignments
        const userId = (session.user as any).id;
        const assignments = await UserBattingAssignment.find({ userId })
            .populate({
                path: 'arenaId',
                select: 'name matchId status entryFee',
                populate: {
                    path: 'matchId',
                    select: 'teams status startTime venue'
                }
            })
            .lean();

        // 2. Filter for assignments in LIVE matches
        // Also include 'upcoming' if they are about to start (within 30 mins, i.e. revealed)
        const activeContests = [];

        for (const assignment of assignments) {
            const arena = assignment.arenaId as any;
            if (!arena || !arena.matchId) continue;

            const match = arena.matchId;
            const isLive = match.status === 'live';
            const isRevealed = arena.status === 'revealed' || arena.status === 'full'; // Assuming revealed arenas are active

            if (isLive) {
                // 3. Fetch score for this specific position and innings
                const score = await SlotScore.findOne({
                    matchId: match._id,
                    inningsNumber: assignment.inningsNumber,
                    position: assignment.position
                }).lean();

                activeContests.push({
                    arenaId: arena._id,
                    arenaName: arena.name,
                    matchId: match._id,
                    teams: match.teams,
                    inningsNumber: assignment.inningsNumber,
                    position: assignment.position,
                    score: score || { runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false },
                    matchStatus: match.status
                });
            }
        }

        return NextResponse.json(activeContests);
    } catch (error: any) {
        console.error('Error fetching active contests:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
