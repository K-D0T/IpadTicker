import { cache, DEFAULT_TTL } from '../cache';
import { Game, League, FAVORITE_TEAMS } from './types';
import { getProvider, getMockProvider } from './providers';

async function withFallback<T>(fn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[SportsService] Primary provider failed, falling back to mock:', err);
    return fallbackFn();
  }
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function formatDateESPN(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export async function getNextGame(teamSlug: string, leagueOverride?: League): Promise<Game | null> {
  const team = FAVORITE_TEAMS[teamSlug];
  if (!team) return null;

  const league = leagueOverride || team.league;
  const cacheKey = `next-game:${teamSlug}:${league}`;
  const cached = cache.get<Game | null>(cacheKey);
  if (cached !== null) return cached;

  const provider = getProvider();
  const mock = getMockProvider();

  const games = await withFallback(
    () => provider.getTeamSchedule(league, team.teamKey),
    () => mock.getTeamSchedule(league, team.teamKey),
  );

  const now = Date.now();

  const upcoming = games
    .filter((g) => g.status === 'pre' && new Date(g.startTime).getTime() > now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const live = games.find((g) => g.status === 'live');

  const next = live || upcoming[0] || null;
  cache.set(cacheKey, next, DEFAULT_TTL);
  return next;
}

export async function getClosestGames(league: League, limit = 5): Promise<Game[]> {
  const cacheKey = `closest:${league}:${limit}`;
  const cached = cache.get<Game[]>(cacheKey);
  if (cached) return cached;

  const provider = getProvider();
  const mock = getMockProvider();

  const games = await withFallback(
    () => provider.getScoreboard(league),
    () => mock.getScoreboard(league),
  );

  const live = games.filter((g) => g.status === 'live');

  const sortedLive = live.sort((a, b) => {
    const diffA = Math.abs((a.homeTeam.score ?? 0) - (a.awayTeam.score ?? 0));
    const diffB = Math.abs((b.homeTeam.score ?? 0) - (b.awayTeam.score ?? 0));
    if (diffA !== diffB) return diffA - diffB;
    const periodA = a.period ?? 0;
    const periodB = b.period ?? 0;
    if (periodA !== periodB) return periodB - periodA;
    return (a.clock ?? '').localeCompare(b.clock ?? '');
  });

  if (sortedLive.length > 0) {
    const result = sortedLive.slice(0, limit);
    cache.set(cacheKey, result, DEFAULT_TTL);
    return result;
  }

  const todayGames = games.filter((g) => {
    if (g.status === 'final') return isToday(g.startTime);
    if (g.status === 'pre') return isToday(g.startTime);
    return false;
  });

  const sorted = todayGames.sort((a, b) => {
    if (a.status === 'final' && b.status !== 'final') return -1;
    if (a.status !== 'final' && b.status === 'final') return 1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });

  const result = sorted.slice(0, limit);
  cache.set(cacheKey, result, DEFAULT_TTL);
  return result;
}

export async function getUpcomingGames(leagues: League[], days = 3): Promise<{ date: string; label: string; games: Game[] }[]> {
  const cacheKey = `upcoming:${leagues.join(',')}:${days}`;
  const cached = cache.get<{ date: string; label: string; games: Game[] }[]>(cacheKey);
  if (cached) return cached;

  const provider = getProvider();
  const mock = getMockProvider();

  const today = new Date();
  const results: { date: string; label: string; games: Game[] }[] = [];

  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateESPN(d);

    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    const allGames: Game[] = [];
    for (const league of leagues) {
      const games = await withFallback(
        () => provider.getScoreboard(league, dateStr),
        () => mock.getScoreboard(league, dateStr),
      );
      const preGames = games.filter((g) => g.status === 'pre');
      allGames.push(...preGames);
    }

    allGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    if (allGames.length > 0) {
      results.push({ date: dateStr, label: dayLabel, games: allGames.slice(0, 8) });
    }
  }

  cache.set(cacheKey, results, 120000); // cache 2 min since upcoming changes less often
  return results;
}
