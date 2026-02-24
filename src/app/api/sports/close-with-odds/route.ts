import { NextRequest, NextResponse } from 'next/server';
import { getClosestGames } from '@/lib/sports/sportsService';
import { Game, League } from '@/lib/sports/types';

const VALID_LEAGUES: League[] = ['nfl', 'ncaaf', 'ncaam'];
const ODDS_CACHE_MS = 2 * 60 * 1000; // 2 min
const ODDS_BOOKMAKER = 'draftkings'; // single book to save credits
const ODDS_MARKET = 'h2h'; // moneyline only

const LEAGUE_TO_ODDS_SPORT: Record<League, string> = {
  nfl: 'americanfootball_nfl',
  ncaaf: 'americanfootball_ncaaf',
  ncaam: 'basketball_ncaab',
};

const cache: { data: CloseWithOddsResponse; at: number } = {
  data: { games: [], oddsByGameId: {} },
  at: 0,
};

type CloseWithOddsResponse = {
  games: Game[];
  oddsByGameId: Record<string, { awayML: number; homeML: number }>;
};

interface OddsEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function matchTeam(oddsName: string, gameName: string, gameAbbr: string): boolean {
  const o = normalize(oddsName);
  const name = normalize(gameName);
  const abbr = gameAbbr.toLowerCase().trim();
  if (!o || !name) return false;
  if (o === name) return true;
  if (o.includes(name) || name.includes(o)) return true;
  if (abbr.length >= 2 && o.includes(abbr)) return true;
  const nameWords = name.split(/\s+/).filter((w) => w.length > 1);
  const oddsWords = o.split(/\s+/).filter((w) => w.length > 1);
  const nameHasOddsWord = nameWords.some((w) => oddsWords.some((ow) => ow.includes(w) || w.includes(ow)));
  const oddsHasNameWord = oddsWords.some((ow) => nameWords.some((w) => ow.includes(w) || w.includes(ow)));
  if (nameHasOddsWord && oddsHasNameWord) return true;
  return false;
}

function findMatchingOddsEvent(events: OddsEvent[], game: Game): OddsEvent | null {
  const gameDate = new Date(game.startTime).toDateString();
  for (const ev of events) {
    const evDate = new Date(ev.commence_time).toDateString();
    if (evDate !== gameDate) continue;
    const awayMatch = matchTeam(ev.away_team, game.awayTeam.name, game.awayTeam.abbr);
    const homeMatch = matchTeam(ev.home_team, game.homeTeam.name, game.homeTeam.abbr);
    if (awayMatch && homeMatch) return ev;
  }
  return null;
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

    const key = process.env.THEODDSAPI_KEY?.trim();
    const oddsByGameId: Record<string, { awayML: number; homeML: number }> = {};

    if (key && games.length > 0) {
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

      const sportKeys = [...new Set(games.map((g) => LEAGUE_TO_ODDS_SPORT[g.league]))];
      const regionsEnv = process.env.REGIONS || 'us';
      const regions = regionsEnv === 'us_dfs' ? 'us' : regionsEnv;

      for (const sport of sportKeys) {
        const url = new URL(`https://api.the-odds-api.com/v4/sports/${sport}/odds`);
        url.searchParams.set('apiKey', key);
        url.searchParams.set('regions', regions);
        url.searchParams.set('markets', ODDS_MARKET);
        url.searchParams.set('oddsFormat', 'american');
        url.searchParams.set('bookmakers', ODDS_BOOKMAKER);

        try {
          let res = await fetch(url.toString());
          if (!res.ok && regions !== 'us') {
            url.searchParams.set('regions', 'us');
            res = await fetch(url.toString());
          }
          if (!res.ok) continue;
          const events: OddsEvent[] = await res.json();
          if (!Array.isArray(events) || events.length === 0) continue;
          const leagueForSport = (Object.entries(LEAGUE_TO_ODDS_SPORT).find(([, v]) => v === sport)?.[0]) as League | undefined;
          if (!leagueForSport) continue;
          const gamesInSport = games.filter((g) => g.league === leagueForSport);
          for (const game of gamesInSport) {
            const ev = findMatchingOddsEvent(events, game);
            if (ev) {
              const book = ev.bookmakers[0];
              const h2h = book?.markets.find((m) => m.key === 'h2h');
              if (h2h) {
                const away = h2h.outcomes.find((o) => o.name === ev.away_team);
                const home = h2h.outcomes.find((o) => o.name === ev.home_team);
                if (away != null && home != null) {
                  oddsByGameId[game.id] = { awayML: away.price, homeML: home.price };
                }
              }
            }
          }
        } catch (e) {
          console.warn('[close-with-odds] Odds fetch error', sport, e);
        }
      }

      cache.data = { games, oddsByGameId };
      cache.at = now;
    }

    return NextResponse.json({ games, oddsByGameId });
  } catch (err) {
    console.error('[API /sports/close-with-odds]', err);
    return NextResponse.json({ error: 'Failed to fetch closest games' }, { status: 500 });
  }
}
