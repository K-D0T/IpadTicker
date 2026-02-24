import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { runWithCookiesAsync, getPendingCookieUpdate, getSpotifyCookieHeaders } from '@/lib/music/spotify';
import { getMusicService } from '@/lib/music/musicService';

const secure = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function GET() {
  const cookieStore = await cookies();
  try {
    const queue = await runWithCookiesAsync(cookieStore, async () => {
      const service = getMusicService();
      return service.getQueue();
    });
    const res = NextResponse.json({ queue: queue ?? [] });
    const pending = getPendingCookieUpdate();
    if (pending) {
      getSpotifyCookieHeaders(pending, secure).forEach((value) => res.headers.append('Set-Cookie', value));
    }
    return res;
  } catch (err) {
    console.error('[API /music/queue-list]', err);
    return NextResponse.json({ queue: [] });
  }
}
