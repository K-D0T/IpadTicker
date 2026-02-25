import { NextRequest, NextResponse } from 'next/server';
import { getNextGame, getNextGameByTeamKey } from '@/lib/sports/sportsService';
import { League } from '@/lib/sports/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const team = searchParams.get('team');
  const teamKey = searchParams.get('teamKey')?.trim().toUpperCase();
  const league = searchParams.get('league') as League | null;

  const validLeagues: League[] = ['nfl', 'ncaaf', 'ncaam'];
  if (teamKey) {
    if (!league || !validLeagues.includes(league)) {
      return NextResponse.json(
        { error: 'Invalid or missing league. Use nfl, ncaaf, or ncaam.' },
        { status: 400 },
      );
    }
    try {
      const game = await getNextGameByTeamKey(teamKey, league);
      return NextResponse.json({ game });
    } catch (err) {
      console.error('[API /sports/next teamKey]', err);
      return NextResponse.json({ error: 'Failed to fetch next game for teamKey' }, { status: 500 });
    }
  }

  if (!team || !['ravens', 'razorbacks'].includes(team)) {
    return NextResponse.json(
      { error: 'Invalid team. Use "ravens" or "razorbacks".' },
      { status: 400 },
    );
  }

  try {
    const game = await getNextGame(team, league || undefined);
    return NextResponse.json({ game });
  } catch (err) {
    console.error('[API /sports/next]', err);
    return NextResponse.json({ error: 'Failed to fetch next game' }, { status: 500 });
  }
}
