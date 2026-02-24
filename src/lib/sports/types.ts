export type GameStatus = 'pre' | 'live' | 'final';

export type League = 'nfl' | 'ncaaf' | 'ncaam';

export interface Team {
  name: string;
  abbr: string;
  logo?: string;
  score: number | null;
}

export interface Game {
  id: string;
  league: League;
  status: GameStatus;
  startTime: string; // ISO 8601
  homeTeam: Team;
  awayTeam: Team;
  clock: string | null;
  period: number | null;
  venue: string | null;
}

export interface FavoriteTeam {
  league: League;
  teamKey: string;
  displayName: string;
}

export const FAVORITE_TEAMS: Record<string, FavoriteTeam> = {
  ravens: {
    league: 'nfl',
    teamKey: 'BAL',
    displayName: 'Baltimore Ravens',
  },
  razorbacks: {
    league: 'ncaam', // default; overridden by settings
    teamKey: 'ARK',
    displayName: 'Arkansas Razorbacks',
  },
};

export function leagueDisplayName(league: League): string {
  switch (league) {
    case 'nfl': return 'NFL';
    case 'ncaaf': return 'NCAA Football';
    case 'ncaam': return 'NCAA Basketball';
  }
}

const NCAA_TEAM_IDS: Record<string, number> = {
  ARK: 8, ALA: 333, LSU: 99, UGA: 61, TENN: 2633,
  DUKE: 150, UNC: 153, UK: 96, KU: 2305, BAY: 239,
  AUB: 2, MISS: 145, TAMU: 245, MIZ: 142,
  SF: 0, SEA: 0,
};

export function teamLogoUrl(abbr: string, league: League): string {
  if (league === 'nfl') {
    return `https://a.espncdn.com/i/teamlogos/nfl/500/${abbr.toLowerCase()}.png`;
  }
  const id = NCAA_TEAM_IDS[abbr];
  if (id) {
    return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
  }
  return '';
}

export function proxyLogoUrl(abbr: string, league: League): string {
  const raw = teamLogoUrl(abbr, league);
  if (!raw) return '';
  return `/api/img?url=${encodeURIComponent(raw)}`;
}
