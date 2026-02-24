import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders, isSpotifyConnected, cookieStoreFromRequest, type CookieStore } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

function mergeCookieStores(primary: CookieStore, fallback: CookieStore): CookieStore {
  return {
    get(name: string) {
      return primary.get(name) ?? fallback.get(name);
    },
  };
}

export async function GET(request: NextRequest) {
  const seedTrackId = request.nextUrl.searchParams.get('seed')?.trim() || undefined;
  const fromHeaders = cookieStoreFromRequest(request);
  const fromNext = await cookies();
  const nextStore: CookieStore = {
    get: (name) => {
      const c = fromNext.get(name);
      return c ? { value: c.value } : undefined;
    },
  };
  const cookieStore = mergeCookieStores(nextStore, fromHeaders);
  try {
    const tracks = await runWithCookiesAsync(cookieStore, async () => {
      if (!isSpotifyConnected()) {
        console.warn('[API /music/recommendations] No Spotify tokens (cookies + file fallback both empty)');
        return [];
      }
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
