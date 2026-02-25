'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game, teamAbbrWithRank } from '@/lib/sports/types';
import { resolveFavoriteTeams } from '@/lib/sports/favorites';

interface TickerMessage {
  id: string;
  icon: string;
  text: string;
}

interface BottomTickerProps {
  refreshInterval: number;
  razorbacksLeague: 'ncaaf' | 'ncaam';
  leagues: string[];
  favoriteTeamIds: string[];
  alertCloseMargin: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

interface LiveSnapshot {
  leader: string | null;
  margin: number;
}

function formatCountdown(startTime: string): string {
  const diff = new Date(startTime).getTime() - Date.now();
  if (diff <= 0) return 'Starting soon';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function parseTimeMinutes(value: string): number {
  const parts = value.split(':');
  const hour = Number(parts[0] ?? 0);
  const minute = Number(parts[1] ?? 0);
  return (hour * 60) + minute;
}

function isInQuietHours(now: Date, enabled: boolean, start: string, end: string): boolean {
  if (!enabled) return false;
  const nowMinutes = (now.getHours() * 60) + now.getMinutes();
  const startMinutes = parseTimeMinutes(start);
  const endMinutes = parseTimeMinutes(end);
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function liveSnapshot(game: Game): LiveSnapshot {
  const home = game.homeTeam.score ?? 0;
  const away = game.awayTeam.score ?? 0;
  const margin = Math.abs(home - away);
  const leader = home === away ? null : (home > away ? game.homeTeam.abbr : game.awayTeam.abbr);
  return { leader, margin };
}

export default function BottomTicker({
  refreshInterval,
  razorbacksLeague,
  leagues,
  favoriteTeamIds,
  alertCloseMargin,
  quietHoursEnabled,
  quietHoursStart,
  quietHoursEnd,
}: BottomTickerProps) {
  const favorites = useMemo(
    () => resolveFavoriteTeams(favoriteTeamIds, razorbacksLeague),
    [favoriteTeamIds, razorbacksLeague],
  );

  const [messages, setMessages] = useState<TickerMessage[]>([
    { id: 'loading', icon: 'FB', text: 'Loading scores and schedules...' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [priorityAlert, setPriorityAlert] = useState<TickerMessage | null>(null);
  const [alertUntil, setAlertUntil] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const previousLiveRef = useRef<Record<string, LiveSnapshot>>({});

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs: TickerMessage[] = [];
      let nextAlert: TickerMessage | null = null;

      for (const favorite of favorites) {
        try {
          const res = await fetch(`/api/sports/next?teamKey=${favorite.teamKey}&league=${favorite.league}`);
          const data = await res.json();
          if (data.game) {
            const g: Game = data.game;
            const isHome = g.homeTeam.abbr === favorite.teamKey;
            const opp = isHome ? g.awayTeam.name : g.homeTeam.name;
            msgs.push({
              id: `next-${favorite.id}`,
              icon: favorite.icon,
              text: `Next ${favorite.label}: ${isHome ? 'vs' : '@'} ${opp} - ${formatCountdown(g.startTime)}`,
            });
          }
        } catch {
          // ignore a single favorite failure
        }
      }

      const latestLive: Record<string, LiveSnapshot> = {};
      for (const league of leagues) {
        try {
          const res = await fetch(`/api/sports/close?league=${league}&limit=1`);
          const data = await res.json();
          if (data.games?.length > 0) {
            const g: Game = data.games[0];
            const diff = Math.abs((g.homeTeam.score ?? 0) - (g.awayTeam.score ?? 0));
            msgs.push({
              id: `close-${league}`,
              icon: diff <= alertCloseMargin ? 'ALERT' : 'LIVE',
              text: `Closest ${league.toUpperCase()}: ${teamAbbrWithRank(g.awayTeam)} ${g.awayTeam.score} @ ${teamAbbrWithRank(g.homeTeam)} ${g.homeTeam.score} (${g.clock || ''} P${g.period || ''})`,
            });

            if (g.status === 'live') {
              const current = liveSnapshot(g);
              latestLive[g.id] = current;
              const previous = previousLiveRef.current[g.id];
              const quiet = isInQuietHours(new Date(), quietHoursEnabled, quietHoursStart, quietHoursEnd);
              if (!quiet && previous) {
                if (previous.leader && current.leader && previous.leader !== current.leader) {
                  nextAlert = {
                    id: `alert-lead-${g.id}`,
                    icon: 'ALERT',
                    text: `Lead change: ${g.awayTeam.abbr} ${g.awayTeam.score} @ ${g.homeTeam.abbr} ${g.homeTeam.score}`,
                  };
                } else if (previous.margin > alertCloseMargin && current.margin <= alertCloseMargin) {
                  nextAlert = {
                    id: `alert-close-${g.id}`,
                    icon: 'ALERT',
                    text: `Close game now: ${g.awayTeam.abbr} ${g.awayTeam.score} @ ${g.homeTeam.abbr} ${g.homeTeam.score}`,
                  };
                }
              }
            }
          }
        } catch {
          // ignore league fetch failure
        }
      }
      previousLiveRef.current = latestLive;

      if (nextAlert) {
        const ttl = Date.now() + 15000;
        setPriorityAlert(nextAlert);
        setAlertUntil(ttl);
      }

      if (msgs.length === 0) {
        msgs.push({ id: 'none', icon: 'NET', text: 'No upcoming games or live scores available' });
      }

      setMessages(msgs);
    };

    fetchMessages();
    const id = setInterval(fetchMessages, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, leagues, favorites, alertCloseMargin, quietHoursEnabled, quietHoursStart, quietHoursEnd]);

  useEffect(() => {
    if (messages.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [messages]);

  const alertActive = priorityAlert && Date.now() < alertUntil;
  const current = alertActive
    ? priorityAlert
    : (messages[currentIndex % messages.length] || messages[0]);

  return (
    <div className={`ticker-bar ${alertActive ? 'ticker-alert' : ''}`}>
      <div
        className="led-dots pointer-events-none absolute inset-0 z-10"
        style={{ opacity: alertActive ? 0.12 : 0.06 }}
      />
      <div className="relative z-20 flex items-center gap-2 h-full px-4 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${alertActive ? 'bg-orange-400' : 'bg-cyan-400'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${alertActive ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-cyan-500 shadow-[0_0_6px_rgba(0,200,255,0.6)]'}`} />
          </span>
          <span className={`text-[9px] uppercase tracking-[0.2em] font-bold ml-1 ${alertActive ? 'text-orange-300' : 'text-gray-500'}`}>{alertActive ? 'ALERT' : 'LIVE'}</span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex-1 overflow-hidden relative h-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current?.id || 'empty'}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center"
            >
              <span className="mr-2 text-[10px] font-bold text-cyan-300">{current?.icon}</span>
              <span className={`text-[13px] truncate tracking-wide font-medium ${alertActive ? 'text-orange-200 score-glow-orange' : 'text-gray-400'}`}>{current?.text || ''}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {!alertActive && messages.length > 1 && (
          <div className="flex gap-1 shrink-0">
            {messages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all touch-manipulation ${
                  i === currentIndex % messages.length
                    ? 'bg-cyan-400 shadow-[0_0_4px_rgba(0,200,255,0.6)]'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
