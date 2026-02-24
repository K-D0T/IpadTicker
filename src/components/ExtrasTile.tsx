'use client';

import { useEffect, useState } from 'react';
import { CloudSun } from 'lucide-react';
import LedOverlay from './LedOverlay';

export default function ExtrasTile() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/weather')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.temp != null) setWeather({ temp: data.temp });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const timeStr = time.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateStr = time.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <LedOverlay className="tile-card flex items-center gap-4 py-2.5 px-5 w-fit" intensity={0.07}>
      {/* Clock */}
      <div className="flex items-center gap-3">
        <p className="text-2xl font-bold tabular-nums text-white tracking-widest score-glow led-flicker">
          {timeStr}
        </p>
        <div className="w-px h-6 bg-white/10" />
        <p className="text-xs text-gray-500 tracking-wide whitespace-nowrap">{dateStr}</p>
      </div>

      {/* Weather */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-white/5">
        <CloudSun className="w-5 h-5 text-amber-400/80" />
        <span className="text-sm font-bold text-white tabular-nums score-glow">
          {weather != null ? `${weather.temp}°` : '—°'}
        </span>
      </div>
    </LedOverlay>
  );
}
