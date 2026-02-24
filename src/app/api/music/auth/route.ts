import { NextResponse } from 'next/server';
import { getSpotifyAuthUrl } from '@/lib/music/spotify';

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'SPOTIFY_CLIENT_ID not configured in .env.local' },
      { status: 500 },
    );
  }

  const url = getSpotifyAuthUrl();
  return NextResponse.redirect(url);
}
