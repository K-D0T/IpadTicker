import { NextResponse } from 'next/server';
import { isSpotifyConnected } from '@/lib/music/spotify';

export async function GET() {
  return NextResponse.json({
    connected: isSpotifyConnected(),
    configured: !!process.env.SPOTIFY_CLIENT_ID,
  });
}
