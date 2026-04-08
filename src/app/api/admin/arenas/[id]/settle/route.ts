import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { settleArena } from '@/lib/revealLogic';

/**
 * POST /api/admin/arenas/[id]/settle
 * Quick Settlement for Administrators
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: arenaId } = await params;
        const session = await getServerSession(authOptions);
        
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const result = await settleArena(arenaId);
        
        if (result.success) {
            return NextResponse.json({ message: result.message });
        } else {
            return NextResponse.json({ message: result.message }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Settlement Error:", error.message);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
