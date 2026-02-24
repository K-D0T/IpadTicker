import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function GET(request: NextRequest) {
  const seedTrackId = request.nextUrl.searchParams.get('seed')?.trim() || undefined;
  const cookieStore = await cookies();
  try {
    const tracks = await runWithCookiesAsync(cookieStore, async () => {
      const service = getMusicService();
      return service.getRecommendations(seedTrackId);
    });
    const res = NextResponse.json({ tracks: tracks ?? [] });
    const pending = getPendingCookieUpdate();
    if (pending) {
      getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
    }
    return res;
  } catch (err) {
    console.error('[API /music/recommendations]', err);
    return NextResponse.json({ tracks: [] });
  }
}
