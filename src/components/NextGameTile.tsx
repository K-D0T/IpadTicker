'use client';

import { usePolling } from '@/hooks/usePolling';
import { GameCardSkeleton } from './LoadingSkeleton';
import { Game, League, proxyLogoUrl, leagueDisplayName, teamAbbrWithRank, teamNameWithRank } from '@/lib/sports/types';
import { resolveFavoriteTeams } from '@/lib/sports/favorites';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { MapPin, Zap } from 'lucide-react';
import LedOverlay from './LedOverlay';
import PixelLogo from './PixelLogo';

interface NextGameTileProps {
  refreshInterval: number;
  razorbacksLeague: 'ncaaf' | 'ncaam';
  selectedLeagues: League[];
  favoriteTeamIds: string[];
}

interface NextGameResponse { game: Game | null; }
interface CloseGamesResponse { games: Game[]; }

interface FavoriteNextEntry {
  id: string;
  label: string;
  abbr: string;
  league: League;
  game: Game | null;
}

function logoSrc(team: { abbr: string; logo?: string }, league: League): string {
  if (team.logo) return `/api/img?url=${encodeURIComponent(team.logo)}`;
  return proxyLogoUrl(team.abbr, league);
}

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!targetDate) { setTimeLeft(''); return; }
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Starting soon'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return timeLeft;
}

function LiveHero({ game, favoriteTeamKeys }: { game: Game; favoriteTeamKeys: Set<string> }) {
  const myIsHome = favoriteTeamKeys.has(game.homeTeam.abbr);
  const myTeam = myIsHome ? game.homeTeam : game.awayTeam;
  const oppTeam = myIsHome ? game.awayTeam : game.homeTeam;
  const myLogo = logoSrc(myTeam, game.league);
  const oppLogo = logoSrc(oppTeam, game.league);
  const myScore = myTeam.score ?? 0;
  const oppScore = oppTeam.score ?? 0;
  const winning = myScore > oppScore;
  const tied = myScore === oppScore;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 rounded-xl live-hero-bg border border-red-500/15 p-4 flex flex-col relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5 led-pulse pointer-events-none" />

      <div className="flex items-center justify-between relative z-10 mb-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">LIVE</span>
          <span className="text-[10px] text-gray-600 ml-1">.</span>
          <span className="text-[10px] text-gray-500 tracking-wider">{leagueDisplayName(game.league)}</span>
        </div>
        <div className="flex items-center gap-2 tabular-nums">
          {game.period && (
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 font-bold text-[11px] text-gray-400">
              {game.league === 'ncaam' ? 'H' : 'Q'}{game.period}
            </span>
          )}
          {game.clock && (
            <span className="font-bold text-white score-glow text-base tracking-widest">{game.clock}</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-5 relative z-10">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <PixelLogo src={myLogo} size={90} pixelResolution={22} glow />
          <p className="text-xs font-bold text-gray-200 tracking-wider text-center">{myTeam.name}</p>
          <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
            myIsHome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>{myIsHome ? 'HOME' : 'AWAY'}</span>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-[120px]">
          <div className="flex items-end gap-3">
            <span className={`text-5xl font-black tabular-nums tracking-wider ${winning || tied ? 'text-white score-glow' : 'text-gray-500'}`}>{myScore}</span>
            <span className="text-lg text-gray-600 font-bold pb-2">-</span>
            <span className={`text-5xl font-black tabular-nums tracking-wider ${!winning || tied ? 'text-white score-glow' : 'text-gray-500'}`}>{oppScore}</span>
          </div>
          {!tied && (
            <div className="flex items-center gap-1">
              <Zap className={`w-3 h-3 ${winning ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-[9px] font-bold tracking-widest ${winning ? 'text-emerald-400' : 'text-red-400'}`}>
                {winning ? 'LEADING' : 'TRAILING'} BY {Math.abs(myScore - oppScore)}
              </span>
            </div>
          )}
          {tied && <span className="text-[9px] font-bold tracking-widest text-amber-400">TIED</span>}
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          <PixelLogo src={oppLogo} size={90} pixelResolution={22} />
          <p className="text-xs font-bold text-gray-200 tracking-wider text-center">{oppTeam.name}</p>
          <span className={`text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
            !myIsHome ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>{!myIsHome ? 'HOME' : 'AWAY'}</span>
        </div>
      </div>

      {game.venue && (
        <div className="flex items-center justify-center gap-1.5 mt-2 relative z-10">
          <MapPin className="w-3 h-3 text-gray-600" />
          <span className="text-[10px] text-gray-500 tracking-wide">{game.venue}</span>
        </div>
      )}
    </motion.div>
  );
}

function UpcomingCard({ game, label, teamAbbr, teamLeague, solo }: {
  game: Game | null;
  label: string;
  teamAbbr: string;
  teamLeague: League;
  solo: boolean;
}) {
  const countdown = useCountdown(game?.startTime);

  if (!game) {
    const fallbackLogo = proxyLogoUrl(teamAbbr, teamLeague);

    return (
      <div className={`rounded-xl bg-black/20 border border-white/5 flex items-center gap-4 px-5 py-3 ${solo ? 'flex-1' : ''}`}>
        <PixelLogo src={fallbackLogo} size={44} pixelResolution={16} className="shrink-0 opacity-30" />
        <div>
          <p className="text-sm font-bold text-gray-500">{label}</p>
          <p className="text-[11px] text-gray-700 mt-0.5">No upcoming games currently available</p>
        </div>
      </div>
    );
  }

  const isHome = game.homeTeam.abbr === teamAbbr;
  const myTeam = isHome ? game.homeTeam : game.awayTeam;
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const date = new Date(game.startTime);
  const myLogo = logoSrc(myTeam, game.league);
  const oppLogo = logoSrc(opponent, game.league);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all flex flex-col items-center justify-center ${solo ? 'flex-1 py-5 px-4' : 'py-4 px-4'}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${isHome ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          {label} . {isHome ? 'HOME' : 'AWAY'} . {leagueDisplayName(game.league)}
        </span>
      </div>

      <div className="flex items-center gap-5 mb-3">
        <div className="flex flex-col items-center gap-1">
          <PixelLogo src={myLogo} size={solo ? 72 : 56} pixelResolution={solo ? 22 : 18} glow />
          <span className="text-[10px] font-bold text-gray-300 tracking-wider">{teamAbbrWithRank(myTeam)}</span>
        </div>

        <span className="text-xs text-gray-700 font-bold tracking-widest">VS</span>

        <div className="flex flex-col items-center gap-1">
          <PixelLogo src={oppLogo} size={solo ? 72 : 56} pixelResolution={solo ? 22 : 18} />
          <span className="text-[10px] font-bold text-gray-400 tracking-wider">{teamAbbrWithRank(opponent)}</span>
        </div>
      </div>

      <p className={`font-bold text-gray-200 text-center ${solo ? 'text-base' : 'text-sm'}`}>
        vs {teamNameWithRank(opponent)}
      </p>

      <p className="text-[11px] text-gray-500 mt-1 text-center">
        {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        {' . '}
        {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        {game.venue && ` . ${game.venue}`}
      </p>

      {countdown && (
        <div className="mt-3 text-center">
          <p className={`font-bold tabular-nums tracking-wider score-glow-cyan bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent ${solo ? 'text-3xl' : 'text-2xl'}`}>
            {countdown}
          </p>
          <p className="text-[8px] text-gray-600 tracking-[0.2em] uppercase mt-0.5">until tipoff</p>
        </div>
      )}
    </motion.div>
  );
}

export default function NextGameTile({ refreshInterval, razorbacksLeague, selectedLeagues, favoriteTeamIds }: NextGameTileProps) {
  const favorites = useMemo(
    () => resolveFavoriteTeams(favoriteTeamIds, razorbacksLeague),
    [favoriteTeamIds, razorbacksLeague],
  );

  const favoriteKeys = useMemo(() => new Set(favorites.map((f) => f.teamKey)), [favorites]);

  const nextGames = usePolling<FavoriteNextEntry[]>({
    fetcher: async () => {
      const rows = await Promise.all(
        favorites.map(async (favorite) => {
          const res = await fetch(`/api/sports/next?teamKey=${favorite.teamKey}&league=${favorite.league}`);
          const data: NextGameResponse = await res.json();
          return {
            id: favorite.id,
            label: favorite.label,
            abbr: favorite.teamKey,
            league: favorite.league,
            game: data.game ?? null,
          } satisfies FavoriteNextEntry;
        }),
      );
      return rows;
    },
    interval: refreshInterval,
  });

  const liveGames = usePolling<Game[]>({
    fetcher: async () => {
      const leagues = [...new Set<League>([...selectedLeagues, ...favorites.map((f) => f.league)])];
      const all = await Promise.all(
        leagues.map((lg) =>
          fetch(`/api/sports/close?league=${lg}&limit=10`)
            .then((r) => r.json())
            .then((d: CloseGamesResponse) => d.games || [])
            .catch(() => [] as Game[]),
        ),
      );
      return all.flat();
    },
    interval: refreshInterval,
  });

  const loading = nextGames.loading;
  const myLiveGame = (liveGames.data || []).find(
    (g) => (g.status === 'live') && (favoriteKeys.has(g.homeTeam.abbr) || favoriteKeys.has(g.awayTeam.abbr)),
  );

  const upcomingEntries = [...(nextGames.data || [])].sort((a, b) => {
    if (!a.game) return 1;
    if (!b.game) return -1;
    return new Date(a.game.startTime).getTime() - new Date(b.game.startTime).getTime();
  });

  for (const favorite of favorites) {
    if (!upcomingEntries.some((e) => e.id === favorite.id)) {
      upcomingEntries.push({
        id: favorite.id,
        label: favorite.label,
        abbr: favorite.teamKey,
        league: favorite.league,
        game: null,
      });
    }
  }

  const liveTeamAbbr = myLiveGame
    ? (favoriteKeys.has(myLiveGame.homeTeam.abbr) ? myLiveGame.homeTeam.abbr : myLiveGame.awayTeam.abbr)
    : null;
  const filteredUpcoming = liveTeamAbbr
    ? upcomingEntries.filter((e) => e.abbr !== liveTeamAbbr)
    : upcomingEntries;
  const hasHero = !!myLiveGame;

  return (
    <LedOverlay className="tile-card h-full flex flex-col min-h-0">
      <h2 className="tile-heading mb-2 shrink-0">
        <span className="inline-block w-3 h-3 rounded-sm bg-cyan-500 mr-2 shadow-[0_0_8px_rgba(0,200,255,0.5)]" />
        My Teams
      </h2>

      {loading ? (
        <div className="flex flex-col gap-2 flex-1"><GameCardSkeleton /><GameCardSkeleton /></div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto scrollbar-hide">
          <AnimatePresence mode="wait">
            {myLiveGame && <LiveHero key={`live-${myLiveGame.id}`} game={myLiveGame} favoriteTeamKeys={favoriteKeys} />}
          </AnimatePresence>

          {filteredUpcoming.map((entry) => (
            <UpcomingCard
              key={entry.id}
              game={entry.game}
              label={entry.label}
              teamAbbr={entry.abbr}
              teamLeague={entry.league}
              solo={!hasHero && filteredUpcoming.filter((e) => e.game).length <= 1}
            />
          ))}
        </div>
      )}

      {nextGames.error && (
        <p className="mt-2 text-xs text-red-400/80">{nextGames.error}</p>
      )}
    </LedOverlay>
  );
}
