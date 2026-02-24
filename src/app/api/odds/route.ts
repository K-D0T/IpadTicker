import { NextRequest, NextResponse } from 'next/server';

const ODDS_CACHE_MS = 2 * 60 * 1000; // 2 min to save quota
const cache: { data: OddsResponse; at: number } = { data: { bySport: {}, usage: null }, at: 0 };

type OddsResponse = {
  bySport: Record<string, OddsEvent[]>;
  usage: { remaining: number; used: number } | null;
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
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
}

export async function GET(request: NextRequest) {
  const key = process.env.THEODDSAPI_KEY;
  if (!key?.trim()) {
    return NextResponse.json({ error: 'THEODDSAPI_KEY not set' }, { status: 503 });
  }

  const now = Date.now();
  if (cache.at && now - cache.at < ODDS_CACHE_MS) {
    return NextResponse.json(cache.data);
  }

  let regions = process.env.REGIONS || 'us';
  const markets = process.env.ODDS_MARKETS || 'h2h,spreads,totals';
  const bookmakers = process.env.BOOKMAKER_ALLOWLIST?.trim();
  const sportKeys = (process.env.SPORT_KEYS || 'basketball_nba,basketball_ncaab,americanfootball_nfl,americanfootball_ncaaf,baseball_mlb,icehockey_nhl')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const bySport: Record<string, OddsEvent[]> = {};
  let usage: { remaining: number; used: number } | null = null;

  for (const sport of sportKeys) {
    const url = new URL(`https://api.the-odds-api.com/v4/sports/${sport}/odds`);
    url.searchParams.set('apiKey', key);
    url.searchParams.set('regions', regions);
    url.searchParams.set('markets', markets);
    url.searchParams.set('oddsFormat', 'american');
    if (bookmakers) url.searchParams.set('bookmakers', bookmakers);

    try {
      let res = await fetch(url.toString());
      const remaining = res.headers.get('x-requests-remaining');
      const used = res.headers.get('x-requests-used');
      if (remaining != null) usage = { remaining: parseInt(remaining, 10), used: parseInt(used || '0', 10) };

      if (!res.ok && regions !== 'us') {
        url.searchParams.set('regions', 'us');
        res = await fetch(url.toString());
      }
      if (!res.ok) {
        const text = await res.text();
        console.warn(`Odds API ${sport}: ${res.status} ${text.slice(0, 200)}`);
        bySport[sport] = [];
        continue;
      }

      const events: OddsEvent[] = await res.json();
      bySport[sport] = events;
    } catch (e) {
      console.warn('Odds fetch error', e);
      bySport[sport] = [];
    }
  }

  const data: OddsResponse = { bySport, usage };
  cache.data = data;
  cache.at = now;
  return NextResponse.json(data);
}
