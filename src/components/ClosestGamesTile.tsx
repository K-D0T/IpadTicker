'use client';

import { usePolling } from '@/hooks/usePolling';
import { ScoreRowSkeleton } from './LoadingSkeleton';
import { Game, League, leagueDisplayName, proxyLogoUrl } from '@/lib/sports/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import LedOverlay from './LedOverlay';
import PixelLogo from './PixelLogo';

interface ClosestGamesTileProps {
  leagues: League[];
  refreshInterval: number;
}

interface CloseWithOddsResponse {
  games: Game[];
  oddsByGameId: Record<string, { awayML: number; homeML: number }>;
}
interface UpcomingDay { date: string; label: string; games: Game[]; }
interface UpcomingResponse { upcoming: UpcomingDay[]; }

function formatAmerican(price: number): string {
  if (price > 0) return `+${price}`;
  return `${price}`;
}

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

function GameCard({ game, index, odds }: { game: Game; index: number; odds?: { awayML: number; homeML: number } }) {
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
      {odds && (
        <div className="mt-1.5 pt-1.5 border-t border-white/5 flex items-center justify-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-500/25 text-[8px] font-bold text-cyan-400 uppercase tracking-wider shadow-[0_0_8px_rgba(34,211,238,0.15)]">
            <TrendingUp className="w-2.5 h-2.5" />
            ML
          </span>
          <span className="text-[8px] text-gray-500 font-medium">DraftKings</span>
          <span className={`tabular-nums font-bold text-[10px] min-w-[2.5rem] text-right ${odds.awayML > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {formatAmerican(odds.awayML)}
          </span>
          <span className="text-gray-600 text-[9px]">A</span>
          <span className="text-gray-600">·</span>
          <span className={`tabular-nums font-bold text-[10px] min-w-[2.5rem] text-right ${odds.homeML > 0 ? 'text-emerald-400' : 'text-gray-400'}`}>
            {formatAmerican(odds.homeML)}
          </span>
          <span className="text-gray-600 text-[9px]">H</span>
        </div>
      )}
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
  const closeWithOdds = usePolling<CloseWithOddsResponse>({
    fetcher: async () => {
      const res = await fetch(`/api/sports/close-with-odds?leagues=${leagues.join(',')}&limit=8`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load games');
      return { games: data.games ?? [], oddsByGameId: data.oddsByGameId ?? {} };
    },
    interval: refreshInterval,
  });

  const todayGames = {
    data: closeWithOdds.data?.games ?? null,
    loading: closeWithOdds.loading,
    error: closeWithOdds.error,
  };
  const oddsByGameId = closeWithOdds.data?.oddsByGameId ?? {};

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
                <GameCard key={game.id} game={game} index={i} odds={oddsByGameId[game.id]} />
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
