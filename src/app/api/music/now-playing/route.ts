import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function GET() {
  const cookieStore = await cookies();
  try {
    const nowPlaying = await runWithCookiesAsync(cookieStore, async () => {
      const service = getMusicService();
      return service.getNowPlaying();
    });
    const res = NextResponse.json({ nowPlaying });
    const pending = getPendingCookieUpdate();
    if (pending) {
      getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
    }
    return res;
  } catch (err) {
    console.error('[API /music/now-playing]', err);
    return NextResponse.json(
      { error: 'Music service not available' },
      { status: 501 },
    );
  }
}
