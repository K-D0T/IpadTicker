'use client';

import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Disc3, ChevronDown,
} from 'lucide-react';
import LedOverlay from './LedOverlay';
import PixelLogo from './PixelLogo';
import ScrollingText from './ScrollingText';
import { MusicPlayerState } from '@/hooks/useMusicPlayer';

interface ExpandedMusicPlayerProps {
  music: MusicPlayerState;
  onCollapse: () => void;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ExpandedMusicPlayer({ music, onCollapse }: ExpandedMusicPlayerProps) {
  const { track, volume, setVolume, controlAction } = music;
  const isPlaying = track?.isPlaying ?? false;
  const artSrc = track?.albumArtUrl ? `/api/img?url=${encodeURIComponent(track.albumArtUrl)}` : '';
  const progress = track ? (track.durationMs > 0 ? (track.progressMs / track.durationMs) * 100 : 0) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <LedOverlay className="rounded-xl bg-gradient-to-br from-green-950/30 via-black/50 to-emerald-950/20 border border-green-500/10 p-5" intensity={0.06}>
        {/* Collapse button */}
        <button
          onClick={onCollapse}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
        >
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex gap-5 items-start">
          {/* Album art -- large, clickable to collapse */}
          <button onClick={onCollapse} className="shrink-0 touch-manipulation">
            {artSrc ? (
              <PixelLogo src={artSrc} size={140} pixelResolution={28} glow className="rounded-lg" />
            ) : (
              <div className="w-[140px] h-[140px] rounded-lg bg-green-500/10 border border-green-500/15 flex items-center justify-center">
                <Disc3 className="w-12 h-12 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            )}
          </button>

          {/* Track info + controls */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-[140px]">
            {/* Track info */}
            <div className="min-w-0">
              <ScrollingText className="text-lg font-bold text-white tracking-wide score-glow-green block">
                {track?.title || 'Nothing playing'}
              </ScrollingText>
              <ScrollingText className="text-sm text-gray-400 mt-0.5 block">{track?.artist || ''}</ScrollingText>
              <ScrollingText className="text-xs text-gray-600 mt-0.5 block">{track?.album || ''}</ScrollingText>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-gray-600 tabular-nums">{formatTime(track?.progressMs ?? 0)}</span>
                <span className="text-[9px] text-gray-600 tabular-nums">{formatTime(track?.durationMs ?? 0)}</span>
              </div>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => controlAction('prev')} className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation">
                  <SkipBack className="w-5 h-5 text-gray-400" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => controlAction(isPlaying ? 'pause' : 'play')}
                  className={`p-3 rounded-full transition-colors touch-manipulation ${isPlaying ? 'bg-green-500/25 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-green-400" /> : <Play className="w-5 h-5 text-gray-300 ml-0.5" />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => controlAction('next')} className="p-2.5 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation">
                  <SkipForward className="w-5 h-5 text-gray-400" />
                </motion.button>
              </div>

              <div className="flex items-center gap-1.5 flex-1 max-w-[140px]">
                <Volume2 className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <input type="range" min={0} max={100} value={volume} onChange={(e) => { const v = parseInt(e.target.value, 10); setVolume(v); controlAction('volume', v); }} className="w-full h-1 cursor-pointer touch-manipulation" />
              </div>
            </div>
          </div>
        </div>
      </LedOverlay>
    </motion.div>
  );
}
