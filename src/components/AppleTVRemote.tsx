'use client';

import { useState, useCallback } from 'react';
import LedOverlay from './LedOverlay';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Circle, Home, Play, Volume2, Volume1 } from 'lucide-react';
import { motion } from 'framer-motion';

const sendKey = async (key: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/appletv/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('Apple TV command failed:', data.error ?? res.statusText);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Apple TV request failed:', e);
    return false;
  }
};

const btn =
  'flex items-center justify-center rounded-xl border border-white/15 bg-white/10 active:bg-white/20 active:scale-95 transition-colors touch-manipulation select-none';

export default function AppleTVRemote() {
  const [hint, setHint] = useState<string | null>(null);

  const trigger = useCallback((key: string, label: string) => {
    setHint(null);
    sendKey(key).then((ok) => {
      if (!ok) setHint('Apple TV not set up. See Settings.');
    });
  }, []);

  return (
    <LedOverlay className="tile-card flex flex-col items-center justify-center min-h-[280px] py-6 px-4" intensity={0.12}>
      <h2 className="tile-heading mb-4">Apple TV</h2>

      <div className="flex items-center gap-6">
        {/* Volume */}
        <div className="flex flex-col gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className={`${btn} w-14 h-14`}
            onClick={() => trigger('volumeUp', 'Vol +')}
            aria-label="Volume up"
          >
            <Volume2 className="w-6 h-6 text-gray-400" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className={`${btn} w-14 h-14`}
            onClick={() => trigger('volumeDown', 'Vol −')}
            aria-label="Volume down"
          >
            <Volume1 className="w-6 h-6 text-gray-400" />
          </motion.button>
        </div>

        {/* D-pad + Select */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            <span className="w-12" />
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className={`${btn} w-14 h-14`}
              onClick={() => trigger('up', 'Up')}
              aria-label="Up"
            >
              <ChevronUp className="w-7 h-7 text-gray-300" />
            </motion.button>
            <span className="w-12" />
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className={`${btn} w-14 h-14`}
              onClick={() => trigger('left', 'Left')}
              aria-label="Left"
            >
              <ChevronLeft className="w-7 h-7 text-gray-300" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className={`${btn} w-16 h-16 rounded-full border-2 border-white/25 bg-white/15`}
              onClick={() => trigger('select', 'Select')}
              aria-label="Select"
            >
              <Circle className="w-5 h-5 text-gray-300 fill-gray-300" />
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className={`${btn} w-14 h-14`}
              onClick={() => trigger('right', 'Right')}
              aria-label="Right"
            >
              <ChevronRight className="w-7 h-7 text-gray-300" />
            </motion.button>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-12" />
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              className={`${btn} w-14 h-14`}
              onClick={() => trigger('down', 'Down')}
              aria-label="Down"
            >
              <ChevronDown className="w-7 h-7 text-gray-300" />
            </motion.button>
            <span className="w-12" />
          </div>
        </div>

        {/* Menu / Play-Pause */}
        <div className="flex flex-col gap-3">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className={`${btn} w-14 h-14`}
            onClick={() => trigger('menu', 'Menu')}
            aria-label="Menu"
          >
            <Home className="w-6 h-6 text-gray-400" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            className={`${btn} w-14 h-14`}
            onClick={() => trigger('playPause', 'Play/Pause')}
            aria-label="Play/Pause"
          >
            <Play className="w-6 h-6 text-gray-400 ml-0.5" />
          </motion.button>
        </div>
      </div>

      {hint && (
        <p className="mt-4 text-xs text-amber-500/90 text-center max-w-[200px]">{hint}</p>
      )}
    </LedOverlay>
  );
}
