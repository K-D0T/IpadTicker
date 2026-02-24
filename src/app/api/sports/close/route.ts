import { NextRequest, NextResponse } from 'next/server';
import { getClosestGames } from '@/lib/sports/sportsService';
import { League } from '@/lib/sports/types';

const VALID_LEAGUES: League[] = ['nfl', 'ncaaf', 'ncaam'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const league = searchParams.get('league') as League | null;
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 10) : 5;

  if (!league || !VALID_LEAGUES.includes(league)) {
    return NextResponse.json(
      { error: 'Invalid league. Use "nfl", "ncaaf", or "ncaam".' },
      { status: 400 },
    );
  }

  try {
    const games = await getClosestGames(league, limit);
    return NextResponse.json({ games });
  } catch (err) {
    console.error('[API /sports/close]', err);
    return NextResponse.json({ error: 'Failed to fetch closest games' }, { status: 500 });
  }
}
