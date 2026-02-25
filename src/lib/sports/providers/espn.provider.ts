import { SportsProvider } from './provider.interface';
import { Game, League, GameStatus } from '../types';

const ESPN_BASE = process.env.ESPN_BASE_URL || 'https://site.api.espn.com/apis/site/v2/sports';

const LEAGUE_PATHS: Record<League, string> = {
  nfl: '/football/nfl',
  ncaaf: '/football/college-football',
  ncaam: '/basketball/mens-college-basketball',
};

const TEAM_IDS: Record<string, Record<League, string>> = {
  ATL: { nfl: '1', ncaaf: '', ncaam: '' },
  ARI: { nfl: '22', ncaaf: '', ncaam: '' },
  BAL: { nfl: '33', ncaaf: '', ncaam: '' },
  CAR: { nfl: '29', ncaaf: '', ncaam: '' },
  CHI: { nfl: '3', ncaaf: '', ncaam: '' },
  CIN: { nfl: '4', ncaaf: '', ncaam: '' },
  CLE: { nfl: '5', ncaaf: '', ncaam: '' },
  ARK: { nfl: '', ncaaf: '8', ncaam: '8' },
  DEN: { nfl: '7', ncaaf: '', ncaam: '' },
  DET: { nfl: '8', ncaaf: '', ncaam: '' },
  GB: { nfl: '9', ncaaf: '', ncaam: '' },
  TEN: { nfl: '10', ncaaf: '', ncaam: '' },
  IND: { nfl: '11', ncaaf: '', ncaam: '' },
  LV: { nfl: '13', ncaaf: '', ncaam: '' },
  LAR: { nfl: '14', ncaaf: '', ncaam: '' },
  MIA: { nfl: '15', ncaaf: '', ncaam: '' },
  MIN: { nfl: '16', ncaaf: '', ncaam: '' },
  NE: { nfl: '17', ncaaf: '', ncaam: '' },
  NO: { nfl: '18', ncaaf: '', ncaam: '' },
  NYG: { nfl: '19', ncaaf: '', ncaam: '' },
  NYJ: { nfl: '20', ncaaf: '', ncaam: '' },
  PHI: { nfl: '21', ncaaf: '', ncaam: '' },
  PIT: { nfl: '23', ncaaf: '', ncaam: '' },
  KC: { nfl: '12', ncaaf: '', ncaam: '' },
  BUF: { nfl: '2', ncaaf: '', ncaam: '' },
  DAL: { nfl: '6', ncaaf: '', ncaam: '' },
  SF: { nfl: '25', ncaaf: '', ncaam: '' },
  SEA: { nfl: '26', ncaaf: '', ncaam: '' },
  TB: { nfl: '27', ncaaf: '', ncaam: '' },
  WAS: { nfl: '28', ncaaf: '', ncaam: '' },
  JAX: { nfl: '30', ncaaf: '', ncaam: '' },
  LAC: { nfl: '24', ncaaf: '', ncaam: '' },
  HOU: { nfl: '34', ncaaf: '', ncaam: '' },
  DUKE: { nfl: '', ncaaf: '', ncaam: '150' },
  UNC: { nfl: '', ncaaf: '', ncaam: '153' },
  UK: { nfl: '', ncaaf: '96', ncaam: '96' },
  KU: { nfl: '', ncaaf: '2305', ncaam: '2305' },
  BAY: { nfl: '', ncaaf: '239', ncaam: '239' },
  AUB: { nfl: '', ncaaf: '2', ncaam: '2' },
  ALA: { nfl: '', ncaaf: '333', ncaam: '333' },
  LSU: { nfl: '', ncaaf: '99', ncaam: '99' },
  TENN: { nfl: '', ncaaf: '2633', ncaam: '2633' },
  UGA: { nfl: '', ncaaf: '61', ncaam: '61' },
  MISS: { nfl: '', ncaaf: '145', ncaam: '145' },
  TAMU: { nfl: '', ncaaf: '245', ncaam: '245' },
  MIZ: { nfl: '', ncaaf: '142', ncaam: '142' },
};

function mapStatus(espnStatus: string): GameStatus {
  switch (espnStatus) {
    case 'STATUS_IN_PROGRESS':
    case 'STATUS_HALFTIME':
    case 'STATUS_END_PERIOD':
      return 'live';
    case 'STATUS_FINAL':
    case 'STATUS_FINAL_OVERTIME':
      return 'final';
    default:
      return 'pre';
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function extractLogo(teamObj: any): string | undefined {
  if (typeof teamObj?.logo === 'string') return teamObj.logo;
  if (Array.isArray(teamObj?.logos) && teamObj.logos.length > 0) {
    const dark = teamObj.logos.find((l: any) =>
      Array.isArray(l.rel) && l.rel.includes('dark')
    );
    return dark?.href || teamObj.logos[0]?.href;
  }
  return undefined;
}

function parseCompetition(event: any, league: League): Game {
  const competition = event.competitions?.[0];
  const home = competition?.competitors?.find((c: any) => c.homeAway === 'home');
  const away = competition?.competitors?.find((c: any) => c.homeAway === 'away');
  const statusDetail = competition?.status;

  const toRank = (value: unknown): number | undefined => {
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    if (n < 1 || n > 25) return undefined;
    return n;
  };

  const homeRank = toRank(home?.curatedRank?.current);
  const awayRank = toRank(away?.curatedRank?.current);

  return {
    id: String(event.id || Math.random()),
    league,
    status: mapStatus(statusDetail?.type?.name || ''),
    startTime: event.date || new Date().toISOString(),
    homeTeam: {
      name: home?.team?.displayName || 'TBD',
      abbr: home?.team?.abbreviation || '???',
      logo: extractLogo(home?.team),
      score: home?.score != null ? parseInt(String(home.score), 10) : null,
      rank: homeRank,
    },
    awayTeam: {
      name: away?.team?.displayName || 'TBD',
      abbr: away?.team?.abbreviation || '???',
      logo: extractLogo(away?.team),
      score: away?.score != null ? parseInt(String(away.score), 10) : null,
      rank: awayRank,
    },
    clock: statusDetail?.displayClock ?? null,
    period: statusDetail?.period ?? null,
    venue: competition?.venue?.fullName ?? null,
  };
}

/* eslint-enable @typescript-eslint/no-explicit-any */

export class ESPNProvider implements SportsProvider {
  name = 'ESPNProvider';

  async getScoreboard(league: League, date?: string): Promise<Game[]> {
    const path = LEAGUE_PATHS[league];
    const dateParam = date ? `?dates=${date}` : '';
    const url = `${ESPN_BASE}${path}/scoreboard${dateParam}`;

    const res = await fetch(url, {
      next: { revalidate: 20 },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      throw new Error(`ESPN scoreboard ${league}: ${res.status}`);
    }

    const data = await res.json();
    const events = data.events || [];
    return events.map((e: unknown) => parseCompetition(e, league));
  }

  async getTeamSchedule(league: League, teamKey: string): Promise<Game[]> {
    const path = LEAGUE_PATHS[league];
    const teamId = TEAM_IDS[teamKey]?.[league];

    if (!teamId) {
      throw new Error(`No ESPN team ID mapped for ${teamKey} in ${league}`);
    }

    const teamUrl = `${ESPN_BASE}${path}/teams/${teamId}`;
    const teamRes = await fetch(teamUrl, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(10000),
    });

    if (!teamRes.ok) {
      throw new Error(`ESPN team ${teamKey}/${league}: ${teamRes.status}`);
    }

    const teamData = await teamRes.json();
    const nextEvents = teamData?.team?.nextEvent || [];

    if (nextEvents.length > 0) {
      return nextEvents.map((e: unknown) => parseCompetition(e, league));
    }

    const schedUrl = `${ESPN_BASE}${path}/teams/${teamId}/schedule`;
    const schedRes = await fetch(schedUrl, {
      next: { revalidate: 120 },
      signal: AbortSignal.timeout(10000),
    });

    if (!schedRes.ok) {
      return [];
    }

    const schedData = await schedRes.json();
    const events = schedData.events || [];
    return events.map((e: unknown) => parseCompetition(e, league));
  }
}
