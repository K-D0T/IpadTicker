import { NextResponse } from 'next/server';
import { getMusicService } from '@/lib/music/musicService';

export async function GET() {
  try {
    const service = getMusicService();
    const nowPlaying = await service.getNowPlaying();
    return NextResponse.json({ nowPlaying });
  } catch (err) {
    console.error('[API /music/now-playing]', err);
    return NextResponse.json(
      { error: 'Music service not available' },
      { status: 501 },
    );
  }
}
