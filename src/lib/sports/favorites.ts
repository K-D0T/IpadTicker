import { League } from './types';

export interface FavoriteTeamOption {
  id: string;
  label: string;
  teamKey: string;
  defaultLeague: League;
  icon: string;
  usesRazorbacksLeague?: boolean;
}

export interface ResolvedFavoriteTeam {
  id: string;
  label: string;
  teamKey: string;
  league: League;
  icon: string;
}

export const FAVORITE_TEAM_OPTIONS: FavoriteTeamOption[] = [
  // NFL
  { id: 'ravens', label: 'Baltimore Ravens', teamKey: 'BAL', defaultLeague: 'nfl', icon: 'FB' },
  { id: 'chiefs', label: 'Kansas City Chiefs', teamKey: 'KC', defaultLeague: 'nfl', icon: 'KC' },
  { id: 'bills', label: 'Buffalo Bills', teamKey: 'BUF', defaultLeague: 'nfl', icon: 'BUF' },
  { id: 'cowboys', label: 'Dallas Cowboys', teamKey: 'DAL', defaultLeague: 'nfl', icon: 'DAL' },
  { id: 'eagles', label: 'Philadelphia Eagles', teamKey: 'PHI', defaultLeague: 'nfl', icon: 'PHI' },
  { id: 'steelers', label: 'Pittsburgh Steelers', teamKey: 'PIT', defaultLeague: 'nfl', icon: 'PIT' },
  { id: 'packers', label: 'Green Bay Packers', teamKey: 'GB', defaultLeague: 'nfl', icon: 'GB' },
  { id: 'lions', label: 'Detroit Lions', teamKey: 'DET', defaultLeague: 'nfl', icon: 'DET' },
  { id: 'bengals', label: 'Cincinnati Bengals', teamKey: 'CIN', defaultLeague: 'nfl', icon: 'CIN' },
  { id: 'texans', label: 'Houston Texans', teamKey: 'HOU', defaultLeague: 'nfl', icon: 'HOU' },
  { id: 'niners', label: 'San Francisco 49ers', teamKey: 'SF', defaultLeague: 'nfl', icon: 'SF' },
  { id: 'seahawks', label: 'Seattle Seahawks', teamKey: 'SEA', defaultLeague: 'nfl', icon: 'SEA' },
  { id: 'dolphins', label: 'Miami Dolphins', teamKey: 'MIA', defaultLeague: 'nfl', icon: 'MIA' },
  { id: 'jets', label: 'New York Jets', teamKey: 'NYJ', defaultLeague: 'nfl', icon: 'NYJ' },
  { id: 'patriots', label: 'New England Patriots', teamKey: 'NE', defaultLeague: 'nfl', icon: 'NE' },
  { id: 'chargers', label: 'Los Angeles Chargers', teamKey: 'LAC', defaultLeague: 'nfl', icon: 'LAC' },
  { id: 'raiders', label: 'Las Vegas Raiders', teamKey: 'LV', defaultLeague: 'nfl', icon: 'LV' },
  { id: 'broncos', label: 'Denver Broncos', teamKey: 'DEN', defaultLeague: 'nfl', icon: 'DEN' },
  { id: 'vikings', label: 'Minnesota Vikings', teamKey: 'MIN', defaultLeague: 'nfl', icon: 'MIN' },
  { id: 'bears', label: 'Chicago Bears', teamKey: 'CHI', defaultLeague: 'nfl', icon: 'CHI' },
  { id: 'falcons', label: 'Atlanta Falcons', teamKey: 'ATL', defaultLeague: 'nfl', icon: 'ATL' },
  { id: 'saints', label: 'New Orleans Saints', teamKey: 'NO', defaultLeague: 'nfl', icon: 'NO' },
  { id: 'buccaneers', label: 'Tampa Bay Buccaneers', teamKey: 'TB', defaultLeague: 'nfl', icon: 'TB' },
  { id: 'rams', label: 'Los Angeles Rams', teamKey: 'LAR', defaultLeague: 'nfl', icon: 'LAR' },
  { id: 'cardinals', label: 'Arizona Cardinals', teamKey: 'ARI', defaultLeague: 'nfl', icon: 'ARI' },
  { id: 'jaguars', label: 'Jacksonville Jaguars', teamKey: 'JAX', defaultLeague: 'nfl', icon: 'JAX' },
  { id: 'commanders', label: 'Washington Commanders', teamKey: 'WAS', defaultLeague: 'nfl', icon: 'WAS' },
  // NCAA
  { id: 'razorbacks', label: 'Arkansas Razorbacks', teamKey: 'ARK', defaultLeague: 'ncaam', icon: 'HOG', usesRazorbacksLeague: true },
  { id: 'duke', label: 'Duke Blue Devils', teamKey: 'DUKE', defaultLeague: 'ncaam', icon: 'DUKE' },
  { id: 'unc', label: 'North Carolina', teamKey: 'UNC', defaultLeague: 'ncaam', icon: 'UNC' },
  { id: 'kentucky', label: 'Kentucky Wildcats', teamKey: 'UK', defaultLeague: 'ncaam', icon: 'UK' },
  { id: 'kansas', label: 'Kansas Jayhawks', teamKey: 'KU', defaultLeague: 'ncaam', icon: 'KU' },
  { id: 'baylor', label: 'Baylor Bears', teamKey: 'BAY', defaultLeague: 'ncaam', icon: 'BAY' },
  { id: 'auburn', label: 'Auburn Tigers', teamKey: 'AUB', defaultLeague: 'ncaam', icon: 'AUB' },
  { id: 'tennessee', label: 'Tennessee Volunteers', teamKey: 'TENN', defaultLeague: 'ncaaf', icon: 'TENN' },
  { id: 'alabama', label: 'Alabama', teamKey: 'ALA', defaultLeague: 'ncaaf', icon: 'BAMA' },
  { id: 'lsu', label: 'LSU', teamKey: 'LSU', defaultLeague: 'ncaaf', icon: 'LSU' },
  { id: 'georgia', label: 'Georgia Bulldogs', teamKey: 'UGA', defaultLeague: 'ncaaf', icon: 'UGA' },
  { id: 'ole-miss', label: 'Ole Miss Rebels', teamKey: 'MISS', defaultLeague: 'ncaaf', icon: 'MISS' },
  { id: 'texas-am', label: 'Texas A&M Aggies', teamKey: 'TAMU', defaultLeague: 'ncaaf', icon: 'TAMU' },
  { id: 'missouri', label: 'Missouri Tigers', teamKey: 'MIZ', defaultLeague: 'ncaaf', icon: 'MIZ' },
];

export function resolveFavoriteTeams(
  favoriteTeamIds: string[],
  razorbacksLeague: 'ncaaf' | 'ncaam',
): ResolvedFavoriteTeam[] {
  const byId = new Map(FAVORITE_TEAM_OPTIONS.map((t) => [t.id, t]));
  const resolved: ResolvedFavoriteTeam[] = [];

  for (const id of favoriteTeamIds) {
    const opt = byId.get(id);
    if (!opt) continue;
    const league = opt.usesRazorbacksLeague ? razorbacksLeague : opt.defaultLeague;
    resolved.push({
      id: opt.id,
      label: opt.label,
      teamKey: opt.teamKey,
      league,
      icon: opt.icon,
    });
  }

  if (resolved.length === 0) {
    return [{
      id: 'ravens',
      label: 'Baltimore Ravens',
      teamKey: 'BAL',
      league: 'nfl',
      icon: 'FB',
    }];
  }

  return resolved;
}
