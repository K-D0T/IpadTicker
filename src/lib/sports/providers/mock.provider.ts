import { SportsProvider } from './provider.interface';
import { Game, League, Team, teamLogoUrl } from '../types';

function nflLogo(abbr: string) { return teamLogoUrl(abbr, 'nfl'); }
function ncaaLogo(abbr: string, league: League) { return teamLogoUrl(abbr, league); }

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600000).toISOString();
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

const MOCK_LIVE_NFL: Game[] = [
  {
    id: 'mock-nfl-1',
    league: 'nfl',
    status: 'live',
    startTime: minutesAgo(90),
    homeTeam: { name: 'Kansas City Chiefs', abbr: 'KC', logo: nflLogo('KC'), score: 21 },
    awayTeam: { name: 'Buffalo Bills', abbr: 'BUF', logo: nflLogo('BUF'), score: 20 },
    clock: '4:32',
    period: 3,
    venue: 'Arrowhead Stadium',
  },
  {
    id: 'mock-nfl-2',
    league: 'nfl',
    status: 'live',
    startTime: minutesAgo(120),
    homeTeam: { name: 'Dallas Cowboys', abbr: 'DAL', logo: nflLogo('DAL'), score: 14 },
    awayTeam: { name: 'Philadelphia Eagles', abbr: 'PHI', logo: nflLogo('PHI'), score: 17 },
    clock: '8:15',
    period: 4,
    venue: 'AT&T Stadium',
  },
  {
    id: 'mock-nfl-3',
    league: 'nfl',
    status: 'live',
    startTime: minutesAgo(60),
    homeTeam: { name: 'San Francisco 49ers', abbr: 'SF', logo: nflLogo('SF'), score: 10 },
    awayTeam: { name: 'Seattle Seahawks', abbr: 'SEA', logo: nflLogo('SEA'), score: 7 },
    clock: '0:45',
    period: 2,
    venue: "Levi's Stadium",
  },
];

const MOCK_LIVE_NCAAF: Game[] = [
  {
    id: 'mock-ncaaf-1',
    league: 'ncaaf',
    status: 'live',
    startTime: minutesAgo(100),
    homeTeam: { name: 'Alabama Crimson Tide', abbr: 'ALA', logo: ncaaLogo('ALA', 'ncaaf'), score: 28 },
    awayTeam: { name: 'LSU Tigers', abbr: 'LSU', logo: ncaaLogo('LSU', 'ncaaf'), score: 24 },
    clock: '6:20',
    period: 3,
    venue: 'Bryant-Denny Stadium',
  },
  {
    id: 'mock-ncaaf-2',
    league: 'ncaaf',
    status: 'live',
    startTime: minutesAgo(130),
    homeTeam: { name: 'Georgia Bulldogs', abbr: 'UGA', logo: ncaaLogo('UGA', 'ncaaf'), score: 31 },
    awayTeam: { name: 'Tennessee Volunteers', abbr: 'TENN', logo: ncaaLogo('TENN', 'ncaaf'), score: 30 },
    clock: '2:10',
    period: 4,
    venue: 'Sanford Stadium',
  },
];

const MOCK_LIVE_NCAAM: Game[] = [
  {
    id: 'mock-ncaam-1',
    league: 'ncaam',
    status: 'live',
    startTime: minutesAgo(40),
    homeTeam: { name: 'Duke Blue Devils', abbr: 'DUKE', logo: ncaaLogo('DUKE', 'ncaam'), score: 45 },
    awayTeam: { name: 'North Carolina Tar Heels', abbr: 'UNC', logo: ncaaLogo('UNC', 'ncaam'), score: 44 },
    clock: '8:30',
    period: 2,
    venue: 'Cameron Indoor Stadium',
  },
  {
    id: 'mock-ncaam-2',
    league: 'ncaam',
    status: 'live',
    startTime: minutesAgo(55),
    homeTeam: { name: 'Kentucky Wildcats', abbr: 'UK', logo: ncaaLogo('UK', 'ncaam'), score: 52 },
    awayTeam: { name: 'Arkansas Razorbacks', abbr: 'ARK', logo: ncaaLogo('ARK', 'ncaam'), score: 58 },
    clock: '3:15',
    period: 2,
    venue: 'Rupp Arena',
  },
  {
    id: 'mock-ncaam-3',
    league: 'ncaam',
    status: 'live',
    startTime: minutesAgo(30),
    homeTeam: { name: 'Kansas Jayhawks', abbr: 'KU', logo: ncaaLogo('KU', 'ncaam'), score: 38 },
    awayTeam: { name: 'Baylor Bears', abbr: 'BAY', logo: ncaaLogo('BAY', 'ncaam'), score: 29 },
    clock: '12:45',
    period: 2,
    venue: 'Allen Fieldhouse',
  },
];

function buildUpcomingGames(league: League, teamKey: string): Game[] {
  const teamNames: Record<string, Team> = {
    BAL: { name: 'Baltimore Ravens', abbr: 'BAL', logo: nflLogo('BAL'), score: null },
    ARK: { name: 'Arkansas Razorbacks', abbr: 'ARK', logo: ncaaLogo('ARK', league), score: null },
  };

  const opponents: Record<League, Team[]> = {
    nfl: [
      { name: 'Pittsburgh Steelers', abbr: 'PIT', logo: nflLogo('PIT'), score: null },
      { name: 'Cincinnati Bengals', abbr: 'CIN', logo: nflLogo('CIN'), score: null },
      { name: 'Cleveland Browns', abbr: 'CLE', logo: nflLogo('CLE'), score: null },
    ],
    ncaaf: [
      { name: 'Ole Miss Rebels', abbr: 'MISS', logo: ncaaLogo('MISS', 'ncaaf'), score: null },
      { name: 'Texas A&M Aggies', abbr: 'TAMU', logo: ncaaLogo('TAMU', 'ncaaf'), score: null },
      { name: 'Missouri Tigers', abbr: 'MIZ', logo: ncaaLogo('MIZ', 'ncaaf'), score: null },
    ],
    ncaam: [
      { name: 'Auburn Tigers', abbr: 'AUB', logo: ncaaLogo('AUB', 'ncaam'), score: null },
      { name: 'Tennessee Volunteers', abbr: 'TENN', logo: ncaaLogo('TENN', 'ncaam'), score: null },
      { name: 'LSU Tigers', abbr: 'LSU', logo: ncaaLogo('LSU', 'ncaam'), score: null },
    ],
  };

  const team = teamNames[teamKey] || { name: teamKey, abbr: teamKey };
  const opps = opponents[league] || opponents.nfl;

  return opps.map((opp, i) => {
    const isHome = i % 2 === 0;
    return {
      id: `mock-upcoming-${league}-${teamKey}-${i}`,
      league,
      status: 'pre' as const,
      startTime: hoursFromNow(24 * (i + 1) + 19),
      homeTeam: isHome ? team : opp,
      awayTeam: isHome ? opp : team,
      clock: null,
      period: null,
      venue: isHome ? 'Home Stadium' : 'Away Stadium',
    };
  });
}

export class MockProvider implements SportsProvider {
  name = 'MockProvider';

  async getScoreboard(league: League, _date?: string): Promise<Game[]> {
    await delay(150);
    switch (league) {
      case 'nfl': return [...MOCK_LIVE_NFL];
      case 'ncaaf': return [...MOCK_LIVE_NCAAF];
      case 'ncaam': return [...MOCK_LIVE_NCAAM];
    }
  }

  async getTeamSchedule(league: League, teamKey: string): Promise<Game[]> {
    await delay(100);
    return buildUpcomingGames(league, teamKey);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
