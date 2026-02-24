import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  let body: { index?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const index = typeof body?.index === 'number' ? Math.floor(body.index) : NaN;
  if (Number.isNaN(index) || index < 0) {
    return NextResponse.json({ error: 'Missing or invalid index (0 = next song, 1 = song after, etc.)' }, { status: 400 });
  }

  const cookieStore = await cookies();
  try {
    await runWithCookiesAsync(cookieStore, async () => {
      const service = getMusicService();
      await service.skipToQueueIndex(index);
    });
    const res = NextResponse.json({ ok: true });
    const pending = getPendingCookieUpdate();
    if (pending) {
      getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
    }
    return res;
  } catch (err) {
    console.error('[API /music/skip-to-queue-index]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to skip' },
      { status: 502 },
    );
  }
}
