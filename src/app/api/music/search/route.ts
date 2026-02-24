import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim();
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10) || 20, 30) : 20;

  if (!q) {
    return NextResponse.json({ tracks: [] });
  }

  const cookieStore = await cookies();
  try {
    const tracks = await runWithCookiesAsync(cookieStore, async () => {
      const service = getMusicService();
      return service.searchTracks(q, limit);
    });
    const res = NextResponse.json({ tracks });
    const pending = getPendingCookieUpdate();
    if (pending) {
      getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
    }
    return res;
  } catch (err) {
    console.error('[API /music/search]', err);
    return NextResponse.json({ error: 'Search failed', tracks: [] }, { status: 501 });
  }
}
