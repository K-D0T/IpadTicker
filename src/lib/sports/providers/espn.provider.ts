import { SportsProvider } from './provider.interface';
import { Game, League, GameStatus } from '../types';

const ESPN_BASE = process.env.ESPN_BASE_URL || 'https://site.api.espn.com/apis/site/v2/sports';

const LEAGUE_PATHS: Record<League, string> = {
  nfl: '/football/nfl',
  ncaaf: '/football/college-football',
  ncaam: '/basketball/mens-college-basketball',
};

const TEAM_IDS: Record<string, Record<League, string>> = {
  BAL: { nfl: '33', ncaaf: '', ncaam: '' },
  ARK: { nfl: '', ncaaf: '8', ncaam: '8' },
  KC: { nfl: '12', ncaaf: '', ncaam: '' },
  BUF: { nfl: '2', ncaaf: '', ncaam: '' },
  DAL: { nfl: '6', ncaaf: '', ncaam: '' },
  SF: { nfl: '25', ncaaf: '', ncaam: '' },
  DUKE: { nfl: '', ncaaf: '', ncaam: '150' },
  UNC: { nfl: '', ncaaf: '', ncaam: '153' },
  ALA: { nfl: '', ncaaf: '333', ncaam: '' },
  LSU: { nfl: '', ncaaf: '99', ncaam: '' },
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

  const homeRank = home?.curatedRank?.current != null ? Number(home.curatedRank.current) : undefined;
  const awayRank = away?.curatedRank?.current != null ? Number(away.curatedRank.current) : undefined;

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
