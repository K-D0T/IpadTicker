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
  { id: 'ravens', label: 'Baltimore Ravens', teamKey: 'BAL', defaultLeague: 'nfl', icon: 'FB' },
  { id: 'razorbacks', label: 'Arkansas Razorbacks', teamKey: 'ARK', defaultLeague: 'ncaam', icon: 'HOG', usesRazorbacksLeague: true },
  { id: 'chiefs', label: 'Kansas City Chiefs', teamKey: 'KC', defaultLeague: 'nfl', icon: 'KC' },
  { id: 'bills', label: 'Buffalo Bills', teamKey: 'BUF', defaultLeague: 'nfl', icon: 'BUF' },
  { id: 'cowboys', label: 'Dallas Cowboys', teamKey: 'DAL', defaultLeague: 'nfl', icon: 'DAL' },
  { id: 'niners', label: 'San Francisco 49ers', teamKey: 'SF', defaultLeague: 'nfl', icon: 'SF' },
  { id: 'duke', label: 'Duke Blue Devils', teamKey: 'DUKE', defaultLeague: 'ncaam', icon: 'DUKE' },
  { id: 'unc', label: 'North Carolina', teamKey: 'UNC', defaultLeague: 'ncaam', icon: 'UNC' },
  { id: 'alabama', label: 'Alabama', teamKey: 'ALA', defaultLeague: 'ncaaf', icon: 'BAMA' },
  { id: 'lsu', label: 'LSU', teamKey: 'LSU', defaultLeague: 'ncaaf', icon: 'LSU' },
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
