import { NextRequest, NextResponse } from 'next/server';
import { getUpcomingGames } from '@/lib/sports/sportsService';
import { League } from '@/lib/sports/types';

const VALID_LEAGUES: League[] = ['nfl', 'ncaaf', 'ncaam'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const leaguesParam = searchParams.get('leagues') || 'nfl,ncaam,ncaaf';
  const daysParam = searchParams.get('days');
  const days = daysParam ? Math.min(parseInt(daysParam, 10), 5) : 3;

  const leagues = leaguesParam
    .split(',')
    .map((l) => l.trim() as League)
    .filter((l) => VALID_LEAGUES.includes(l));

  if (leagues.length === 0) {
    return NextResponse.json({ error: 'No valid leagues' }, { status: 400 });
  }

  try {
    const upcoming = await getUpcomingGames(leagues, days);
    return NextResponse.json({ upcoming });
  } catch (err) {
    console.error('[API /sports/upcoming]', err);
    return NextResponse.json({ error: 'Failed to fetch upcoming games' }, { status: 500 });
  }
}
