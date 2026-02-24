'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Game } from '@/lib/sports/types';

interface TickerMessage {
  id: string;
  icon: string;
  text: string;
}

interface BottomTickerProps {
  refreshInterval: number;
  razorbacksLeague: string;
  leagues: string[];
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

export default function BottomTicker({ refreshInterval, razorbacksLeague, leagues }: BottomTickerProps) {
  const [messages, setMessages] = useState<TickerMessage[]>([
    { id: 'loading', icon: '🏈', text: 'Loading scores and schedules...' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs: TickerMessage[] = [];

      try {
        const ravensRes = await fetch('/api/sports/next?team=ravens');
        const ravensData = await ravensRes.json();
        if (ravensData.game) {
          const g: Game = ravensData.game;
          const isHome = g.homeTeam.abbr === 'BAL';
          const opp = isHome ? g.awayTeam.name : g.homeTeam.name;
          msgs.push({
            id: 'ravens-next',
            icon: '🏈',
            text: `Next Ravens game: ${isHome ? 'vs' : '@'} ${opp} — ${formatCountdown(g.startTime)}`,
          });
        }
      } catch { /* skip */ }

      try {
        const arkRes = await fetch(`/api/sports/next?team=razorbacks&league=${razorbacksLeague}`);
        const arkData = await arkRes.json();
        if (arkData.game) {
          const g: Game = arkData.game;
          const isHome = g.homeTeam.abbr === 'ARK';
          const opp = isHome ? g.awayTeam.name : g.homeTeam.name;
          const sportIcon = razorbacksLeague === 'ncaam' ? '🏀' : '🏈';
          msgs.push({
            id: 'razorbacks-next',
            icon: sportIcon,
            text: `Next Razorbacks game: ${isHome ? 'vs' : '@'} ${opp} — ${formatCountdown(g.startTime)}`,
          });
        }
      } catch { /* skip */ }

      for (const league of leagues) {
        try {
          const res = await fetch(`/api/sports/close?league=${league}&limit=1`);
          const data = await res.json();
          if (data.games?.length > 0) {
            const g: Game = data.games[0];
            const diff = Math.abs((g.homeTeam.score ?? 0) - (g.awayTeam.score ?? 0));
            msgs.push({
              id: `close-${league}`,
              icon: diff <= 3 ? '🔥' : '📺',
              text: `Closest ${league.toUpperCase()}: ${g.awayTeam.abbr} ${g.awayTeam.score} @ ${g.homeTeam.abbr} ${g.homeTeam.score} (${g.clock || ''} P${g.period || ''})`,
            });
          }
        } catch { /* skip */ }
      }

      if (msgs.length === 0) {
        msgs.push({ id: 'none', icon: '📡', text: 'No upcoming games or live scores available' });
      }

      setMessages(msgs);
    };

    fetchMessages();
    const id = setInterval(fetchMessages, refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, razorbacksLeague, leagues]);

  useEffect(() => {
    if (messages.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [messages]);

  const current = messages[currentIndex % messages.length] || messages[0];

  return (
    <div className="ticker-bar">
      {/* LED overlay for the ticker */}
      <div
        className="led-dots pointer-events-none absolute inset-0 z-10"
        style={{ opacity: 0.06 }}
      />
      <div className="relative z-20 flex items-center gap-2 h-full px-4 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500 shadow-[0_0_6px_rgba(0,200,255,0.6)]" />
          </span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">LIVE</span>
        </div>

        <div className="w-px h-4 bg-white/10" />

        <div className="flex-1 overflow-hidden relative h-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center"
            >
              <span className="mr-2 text-sm">{current.icon}</span>
              <span className="text-[13px] text-gray-400 truncate tracking-wide font-medium">{current.text}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {messages.length > 1 && (
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
