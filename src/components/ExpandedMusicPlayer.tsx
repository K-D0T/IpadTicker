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
  compact?: boolean;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function ExpandedMusicPlayer({ music, onCollapse, compact = false }: ExpandedMusicPlayerProps) {
  const { track, volume, setVolume, controlAction } = music;
  const isPlaying = track?.isPlaying ?? false;
  const artSrc = track?.albumArtUrl ? `/api/img?url=${encodeURIComponent(track.albumArtUrl)}` : '';
  const progress = track ? (track.durationMs > 0 ? (track.progressMs / track.durationMs) * 100 : 0) : 0;

  const artSize = compact ? 120 : 140;
  const resolution = compact ? 24 : 28;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={`overflow-hidden h-full min-h-0 ${compact ? 'flex flex-col' : ''}`}
    >
      <LedOverlay className={`rounded-xl bg-gradient-to-br from-green-950/30 via-black/50 to-emerald-950/20 border border-green-500/10 h-full min-h-0 flex flex-col ${compact ? 'p-3' : 'p-5'}`} intensity={0.06}>
        {!compact && (
          <button
            onClick={onCollapse}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-lg hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        )}

        <div className={`flex items-start flex-1 min-h-0 ${compact ? 'gap-3' : 'gap-5'}`}>
          <button onClick={compact ? undefined : onCollapse} className={`shrink-0 touch-manipulation ${compact ? 'cursor-default' : ''}`}>
            {artSrc ? (
              <PixelLogo src={artSrc} size={artSize} pixelResolution={resolution} glow className="rounded-lg" />
            ) : (
              <div className={`rounded-lg bg-green-500/10 border border-green-500/15 flex items-center justify-center ${compact ? 'w-[120px] h-[120px]' : 'w-[140px] h-[140px]'}`}>
                <Disc3 className={`text-green-400 animate-spin ${compact ? 'w-10 h-10' : 'w-12 h-12'}`} style={{ animationDuration: '3s' }} />
              </div>
            )}
          </button>

          <div className={`flex-1 min-w-0 flex flex-col justify-between overflow-hidden ${compact ? 'min-h-[120px]' : 'h-[140px]'}`}>
            <div className="min-w-0">
              <ScrollingText className={`font-bold text-white tracking-wide score-glow-green block ${compact ? 'text-sm' : 'text-lg'}`}>
                {track?.title || 'Nothing playing'}
              </ScrollingText>
              <ScrollingText className={`text-gray-400 mt-0.5 block ${compact ? 'text-xs' : 'text-sm'}`}>{track?.artist || ''}</ScrollingText>
              {!compact && (
                <ScrollingText className="text-xs text-gray-600 mt-0.5 block">{track?.album || ''}</ScrollingText>
              )}
            </div>

            <div className={compact ? 'mt-1' : 'mt-3'}>
              <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'linear' }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-gray-600 tabular-nums">{formatTime(track?.progressMs ?? 0)}</span>
                <span className="text-[9px] text-gray-600 tabular-nums">{formatTime(track?.durationMs ?? 0)}</span>
              </div>
            </div>

            <div className={`flex items-center ${compact ? 'gap-1 mt-1' : 'gap-3 mt-2'}`}>
              <div className="flex items-center gap-1">
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => controlAction('prev')} className={`rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation ${compact ? 'p-1.5' : 'p-2.5'}`}>
                  <SkipBack className={compact ? 'w-4 h-4 text-gray-400' : 'w-5 h-5 text-gray-400'} />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => controlAction(isPlaying ? 'pause' : 'play')}
                  className={`rounded-full transition-colors touch-manipulation ${compact ? 'p-2' : 'p-3'} ${isPlaying ? 'bg-green-500/25 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}
                >
                  {isPlaying ? <Pause className={compact ? 'w-4 h-4 text-green-400' : 'w-5 h-5 text-green-400'} /> : <Play className={compact ? 'w-4 h-4 text-gray-300 ml-0.5' : 'w-5 h-5 text-gray-300 ml-0.5'} />}
                </motion.button>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => controlAction('next')} className={`rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation ${compact ? 'p-1.5' : 'p-2.5'}`}>
                  <SkipForward className={compact ? 'w-4 h-4 text-gray-400' : 'w-5 h-5 text-gray-400'} />
                </motion.button>
              </div>

              <div className={`flex items-center gap-1.5 flex-1 ${compact ? 'max-w-[100px]' : 'max-w-[140px]'}`}>
                <Volume2 className={`text-gray-600 shrink-0 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                <input type="range" min={0} max={100} value={volume} onChange={(e) => { const v = parseInt(e.target.value, 10); setVolume(v); controlAction('volume', v); }} className="w-full h-1 cursor-pointer touch-manipulation" />
              </div>
            </div>
          </div>
        </div>
      </LedOverlay>
    </motion.div>
  );
}
