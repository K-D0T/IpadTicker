import { NextRequest, NextResponse } from 'next/server';
import { getNextGame } from '@/lib/sports/sportsService';
import { League } from '@/lib/sports/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const team = searchParams.get('team');
  const league = searchParams.get('league') as League | null;

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
