import { NextRequest, NextResponse } from 'next/server';
import { getMusicService } from '@/lib/music/musicService';
import { MusicAction } from '@/lib/music/types';

const VALID_ACTIONS: MusicAction[] = ['play', 'pause', 'next', 'prev', 'volume'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, value } = body;

    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Use one of: ${VALID_ACTIONS.join(', ')}` },
        { status: 400 },
      );
    }

    const service = getMusicService();
    await service.control({ action, value });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[API /music/control]', err);
    return NextResponse.json(
      { error: 'Music service not configured (501)' },
      { status: 501 },
    );
  }
}
