import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';
import { MusicAction } from '@/lib/music/types';

const VALID_ACTIONS: MusicAction[] = ['play', 'pause', 'next', 'prev', 'volume'];
const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

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

    const cookieStore = await cookies();
    await runWithCookiesAsync(cookieStore, async () => {
      const service = getMusicService();
      await service.control({ action, value });
    });
    const res = NextResponse.json({ ok: true });
    const pending = getPendingCookieUpdate();
    if (pending) {
      getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
    }
    return res;
  } catch (err) {
    console.error('[API /music/control]', err);
    const message = err instanceof Error ? err.message : 'Music service not configured (501)';
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
