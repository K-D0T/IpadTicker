import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookies, getPendingCookieUpdate, getSpotifyCookieHeaders, isSpotifyConnected } from '@/lib/music/spotify';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function GET() {
  const cookieStore = await cookies();
  const connected = runWithCookies(cookieStore, () => isSpotifyConnected());
  const res = NextResponse.json({
    connected,
    configured: !!process.env.SPOTIFY_CLIENT_ID,
  });
  const pending = getPendingCookieUpdate();
  if (pending) {
    getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
  }
  return res;
}
