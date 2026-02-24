import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  let body: { uri?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const uri = typeof body?.uri === 'string' ? body.uri.trim() : '';
  if (!uri || !uri.startsWith('spotify:track:')) {
    return NextResponse.json({ error: 'Missing or invalid uri (must be spotify:track:...)' }, { status: 400 });
  }

  const cookieStore = await cookies();
  try {
    await runWithCookiesAsync(cookieStore, async () => {
      const service = getMusicService();
      await service.playTrack(uri);
    });
    const res = NextResponse.json({ ok: true });
    const pending = getPendingCookieUpdate();
    if (pending) {
      getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
    }
    return res;
  } catch (err) {
    console.error('[API /music/play]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to play track' },
      { status: 502 },
    );
  }
}
