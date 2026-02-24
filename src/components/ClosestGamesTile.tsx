'use client';

import { usePolling } from '@/hooks/usePolling';
import { ScoreRowSkeleton } from './LoadingSkeleton';
import { Game, League, leagueDisplayName, proxyLogoUrl } from '@/lib/sports/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar } from 'lucide-react';
import LedOverlay from './LedOverlay';
import PixelLogo from './PixelLogo';

interface ClosestGamesTileProps {
  leagues: League[];
  refreshInterval: number;
}

interface CloseGamesResponse { games: Game[]; }
interface UpcomingDay { date: string; label: string; games: Game[]; }
interface UpcomingResponse { upcoming: UpcomingDay[]; }

function logoSrc(team: { abbr: string; logo?: string }, league: League): string {
  if (team.logo) return `/api/img?url=${encodeURIComponent(team.logo)}`;
  return proxyLogoUrl(team.abbr, league) || '';
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isPre = game.status === 'pre';
  const diff = Math.abs((game.homeTeam.score ?? 0) - (game.awayTeam.score ?? 0));
  const isNailBiter = isLive && diff <= 3;
  const awayWon = isFinal && (game.awayTeam.score ?? 0) > (game.homeTeam.score ?? 0);
  const homeWon = isFinal && (game.homeTeam.score ?? 0) > (game.awayTeam.score ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-lg px-3 py-2 transition-colors overflow-hidden ${
        isNailBiter
          ? 'bg-orange-500/5 border border-orange-500/10 led-pulse'
          : isLive
            ? 'bg-red-500/5 border border-red-500/8'
            : 'border border-white/[0.04] hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex flex-col items-center gap-0.5 w-[4.5rem] shrink-0 min-w-0">
          <PixelLogo src={logoSrc(game.awayTeam, game.league)} size={38} pixelResolution={14} />
          <span className={`text-[9px] font-bold tracking-wider truncate w-full text-center ${awayWon ? 'text-white' : 'text-gray-400'}`} title={game.awayTeam.abbr}>
            {game.awayTeam.abbr}
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0 shrink-0">
          {isPre ? (
            <>
              <div className="flex items-center gap-3">
                <span className="text-base text-gray-600 font-bold tabular-nums">-</span>
                <span className="text-[9px] text-gray-700 font-bold">@</span>
                <span className="text-base text-gray-600 font-bold tabular-nums">-</span>
              </div>
              <span className="text-[9px] text-cyan-600 tracking-wider font-medium">
                {new Date(game.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className={`text-lg font-black tabular-nums tracking-wider ${awayWon ? 'text-white score-glow' : isFinal ? 'text-gray-500' : 'text-white score-glow'}`}>
                  {game.awayTeam.score ?? 0}
                </span>
                <span className="text-[9px] text-gray-700 font-bold">@</span>
                <span className={`text-lg font-black tabular-nums tracking-wider ${homeWon ? 'text-white score-glow' : isFinal ? 'text-gray-500' : 'text-white score-glow'}`}>
                  {game.homeTeam.score ?? 0}
                </span>
              </div>
              {isLive && isNailBiter && (
                <span className="inline-flex items-center gap-0.5 text-[8px] text-orange-400 font-bold score-glow-orange">
                  <Flame className="w-2.5 h-2.5" /> CLOSE
                </span>
              )}
              {isLive && !isNailBiter && game.clock && (
                <span className="text-[9px] text-gray-500 tabular-nums">
                  {game.period ? (game.league === 'ncaam' ? `H${game.period}` : `Q${game.period}`) : ''} {game.clock}
                </span>
              )}
              {isFinal && (
                <span className="inline-flex items-center gap-0.5 text-[8px] text-gray-600 font-medium tracking-wider">
                  <Trophy className="w-2.5 h-2.5" /> FINAL
                </span>
              )}
            </>
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5 w-[4.5rem] shrink-0 min-w-0">
          <PixelLogo src={logoSrc(game.homeTeam, game.league)} size={38} pixelResolution={14} />
          <span className={`text-[9px] font-bold tracking-wider truncate w-full text-center ${homeWon ? 'text-white' : 'text-gray-400'}`} title={game.homeTeam.abbr}>
            {game.homeTeam.abbr}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function UpcomingGameRow({ game }: { game: Game }) {
  const time = new Date(game.startTime).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded border border-transparent hover:bg-white/[0.02] min-w-0 overflow-hidden">
      <PixelLogo src={logoSrc(game.awayTeam, game.league)} size={28} pixelResolution={12} />
      <span className="text-[10px] font-bold text-gray-400 w-10 min-w-0 truncate text-right shrink-0" title={game.awayTeam.abbr}>{game.awayTeam.abbr}</span>
      <span className="text-[9px] text-gray-700 font-bold shrink-0">@</span>
      <span className="text-[10px] font-bold text-gray-400 w-10 min-w-0 truncate shrink-0" title={game.homeTeam.abbr}>{game.homeTeam.abbr}</span>
      <PixelLogo src={logoSrc(game.homeTeam, game.league)} size={28} pixelResolution={12} />
      <span className="text-[9px] text-gray-600 ml-auto tabular-nums shrink-0">{time}</span>
    </div>
  );
}

export default function ClosestGamesTile({ leagues, refreshInterval }: ClosestGamesTileProps) {
  const todayGames = usePolling<Game[]>({
    fetcher: async () => {
      const promises = leagues.map((league) =>
        fetch(`/api/sports/close?league=${league}&limit=8`)
          .then((r) => r.json())
          .then((d: CloseGamesResponse) => d.games || [])
      );
      const results = await Promise.all(promises);
      const flat = results.flat();
      const live = flat.filter((g) => g.status === 'live');

      if (live.length > 0) {
        return live
          .sort((a, b) => {
            const diffA = Math.abs((a.homeTeam.score ?? 0) - (a.awayTeam.score ?? 0));
            const diffB = Math.abs((b.homeTeam.score ?? 0) - (b.awayTeam.score ?? 0));
            return diffA - diffB;
          })
          .slice(0, 6);
      }

      const today = flat.filter((g) => {
        if (g.status === 'final') return isToday(g.startTime);
        if (g.status === 'pre') return isToday(g.startTime);
        return true;
      });

      return today
        .sort((a, b) => {
          if (a.status === 'final' && b.status !== 'final') return -1;
          if (a.status !== 'final' && b.status === 'final') return 1;
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        })
        .slice(0, 6);
    },
    interval: refreshInterval,
  });

  const upcomingDays = usePolling<UpcomingDay[]>({
    fetcher: async () => {
      const res = await fetch(`/api/sports/upcoming?leagues=${leagues.join(',')}&days=3`);
      const data: UpcomingResponse = await res.json();
      return data.upcoming || [];
    },
    interval: 120000,
  });

  const hasLive = (todayGames.data || []).some((g) => g.status === 'live');
  const todayCount = (todayGames.data || []).length;

  return (
    <LedOverlay className="tile-card h-full flex flex-col">
      <h2 className="tile-heading mb-1">
        <span className={`inline-block w-3 h-3 rounded-sm mr-2 ${
          hasLive ? 'bg-orange-500 shadow-[0_0_8px_rgba(255,150,50,0.5)]' : 'bg-gray-600'
        }`} />
        {hasLive ? 'Closest Games Live' : "Today's Games"}
      </h2>

      <p className="text-[10px] text-gray-600 mb-1.5 tracking-wider font-medium">
        {leagues.map(leagueDisplayName).join(' · ')}
      </p>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Today's games */}
        {todayGames.loading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => <ScoreRowSkeleton key={i} />)}
          </div>
        ) : todayCount > 0 ? (
          <div className="space-y-0.5">
            <AnimatePresence mode="popLayout">
              {todayGames.data!.map((game, i) => (
                <GameCard key={game.id} game={game} index={i} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-gray-600">No games today</p>
          </div>
        )}

        {/* Upcoming days */}
        {(upcomingDays.data || []).map((day) => (
          <div key={day.date} className="mt-3">
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <Calendar className="w-3 h-3 text-gray-600" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{day.label}</span>
              <span className="text-[9px] text-gray-700 ml-1">({day.games.length} games)</span>
            </div>
            <div className="space-y-0">
              {day.games.slice(0, 5).map((game) => (
                <UpcomingGameRow key={game.id} game={game} />
              ))}
              {day.games.length > 5 && (
                <p className="text-[9px] text-gray-700 text-center py-1">
                  +{day.games.length - 5} more
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {todayGames.error && (
        <p className="mt-2 text-xs text-red-400/80">{todayGames.error}</p>
      )}
    </LedOverlay>
  );
}
