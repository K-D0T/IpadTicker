import { NextRequest, NextResponse } from 'next/server';
import { getClosestGames } from '@/lib/sports/sportsService';
import { getEventOdds } from '@/lib/sports/providers/espn.provider';
import { Game, League } from '@/lib/sports/types';

const VALID_LEAGUES: League[] = ['nfl', 'ncaaf', 'ncaam'];
const ODDS_CACHE_MS = 2 * 60 * 1000; // 2 min

const cache: { data: CloseWithOddsResponse; at: number } = {
  data: { games: [], oddsByGameId: {} },
  at: 0,
};

type CloseWithOddsResponse = {
  games: Game[];
  oddsByGameId: Record<string, { awayML: number; homeML: number }>;
};

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const leaguesParam = searchParams.get('leagues');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 10) : 6;

  const leagues = leaguesParam
    ? (leaguesParam.split(',').map((s) => s.trim()) as League[]).filter((l) => VALID_LEAGUES.includes(l))
    : [...VALID_LEAGUES];
  if (leagues.length === 0) {
    return NextResponse.json({ error: 'Invalid leagues' }, { status: 400 });
  }

  try {
    // Build same "closest games" list as ClosestGamesTile
    const promises = leagues.map((league) => getClosestGames(league, 8));
    const results = await Promise.all(promises);
    const flat = results.flat();
    const live = flat.filter((g) => g.status === 'live');
    let games: Game[];
    if (live.length > 0) {
      games = live
        .sort((a, b) => {
          const diffA = Math.abs((a.homeTeam.score ?? 0) - (a.awayTeam.score ?? 0));
          const diffB = Math.abs((b.homeTeam.score ?? 0) - (b.awayTeam.score ?? 0));
          return diffA - diffB;
        })
        .slice(0, limit);
    } else {
      const today = flat.filter((g) => {
        if (g.status === 'final') return isToday(g.startTime);
        if (g.status === 'pre') return isToday(g.startTime);
        return true;
      });
      games = today
        .sort((a, b) => {
          if (a.status === 'final' && b.status !== 'final') return -1;
          if (a.status !== 'final' && b.status === 'final') return 1;
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        })
        .slice(0, limit);
    }

    const oddsByGameId: Record<string, { awayML: number; homeML: number }> = {};

    if (games.length > 0) {
      const now = Date.now();
      const useCache = cache.at && now - cache.at < ODDS_CACHE_MS && cache.data.games.length > 0;
      if (useCache) {
        const cached = cache.data;
        games.forEach((g) => {
          const o = cached.oddsByGameId[g.id];
          if (o) oddsByGameId[g.id] = o;
        });
        return NextResponse.json({ games, oddsByGameId });
      }

      // Free odds sourced from ESPN's own public summary endpoint — no API key needed.
      await Promise.all(games.map(async (game) => {
        const odds = await getEventOdds(game.league, game.id);
        if (odds?.moneyline) {
          oddsByGameId[game.id] = odds.moneyline;
        }
      }));

      cache.data = { games, oddsByGameId };
      cache.at = now;
    }

    return NextResponse.json({ games, oddsByGameId });
  } catch (err) {
    console.error('[API /sports/close-with-odds]', err);
    return NextResponse.json({ error: 'Failed to fetch closest games' }, { status: 500 });
  }
}
