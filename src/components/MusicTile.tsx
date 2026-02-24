'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, Music, Disc3,
} from 'lucide-react';
import LedOverlay from './LedOverlay';
import PixelLogo from './PixelLogo';
import ScrollingText from './ScrollingText';
import { MusicPlayerState } from '@/hooks/useMusicPlayer';

interface MusicTileProps {
  music: MusicPlayerState;
  expanded: boolean;
  onToggleExpand: () => void;
}

export default function MusicTile({ music, expanded, onToggleExpand }: MusicTileProps) {
  const { track, connected, configured, volume, setVolume, controlAction } = music;
  const isPlaying = track?.isPlaying ?? false;
  const artSrc = track?.albumArtUrl ? `/api/img?url=${encodeURIComponent(track.albumArtUrl)}` : '';

  return (
    <LedOverlay className="tile-card flex items-center gap-3 py-2.5 px-4" intensity={0.07}>
      <span className={`shrink-0 w-2 h-2 rounded-full ${
        isPlaying
          ? 'bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.6)] led-pulse'
          : connected ? 'bg-green-800' : 'bg-gray-600'
      }`} />

      <AnimatePresence>
        {track && isPlaying && (
          <motion.button
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 44, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="shrink-0 overflow-hidden touch-manipulation"
            onClick={onToggleExpand}
          >
            {artSrc ? (
              <PixelLogo
                src={artSrc}
                size={44}
                pixelResolution={16}
                glow
                className={`rounded-md transition-all ${expanded ? 'ring-2 ring-green-500/40' : ''}`}
              />
            ) : (
              <div className="w-11 h-11 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Disc3 className="w-5 h-5 text-green-400 animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1 overflow-hidden flex flex-col justify-center">
        {track && isPlaying ? (
          <button onClick={onToggleExpand} className="text-left touch-manipulation w-full min-w-0 block">
            <ScrollingText className="text-sm font-bold text-gray-200 tracking-wide score-glow-green min-h-[1.25rem]">
              {track.title}
            </ScrollingText>
            <ScrollingText className="text-[10px] text-gray-500 mt-0.5 min-h-[0.875rem]">
              {track.artist}{track.album ? ` — ${track.album}` : ''}
            </ScrollingText>
          </button>
        ) : track && !isPlaying ? (
          <p className="text-xs text-gray-500 tracking-wide truncate">
            <span className="text-gray-400 font-medium">Paused</span>
            <span className="mx-1.5 text-gray-700">·</span>
            {track.title}
          </p>
        ) : connected ? (
          <p className="text-xs text-gray-500 tracking-wide">
            <span className="text-green-600 font-medium">Spotify</span>
            <span className="mx-1.5 text-gray-700">·</span>
            Nothing playing
          </p>
        ) : configured ? (
          <a href="/api/music/auth" className="text-xs text-cyan-500 hover:text-cyan-400 tracking-wide font-medium transition-colors">
            <Music className="w-3 h-3 inline mr-1" />Connect Spotify
          </a>
        ) : (
          <p className="text-xs text-gray-600 tracking-wide">
            <span className="text-gray-500 font-medium">Music</span>
            <span className="mx-1.5 text-gray-700">·</span>
            Add Spotify keys to .env.local
          </p>
        )}
      </div>

      {connected && (
        <>
          <div className="flex items-center gap-0.5 shrink-0">
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => controlAction('prev')} className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation">
              <SkipBack className="w-4 h-4 text-gray-500" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => controlAction(isPlaying ? 'pause' : 'play')}
              className={`p-2.5 rounded-full transition-colors touch-manipulation ${isPlaying ? 'bg-green-500/20 border border-green-500/20' : 'bg-white/5 border border-white/5'}`}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-green-400" /> : <Play className="w-4 h-4 text-gray-400 ml-0.5" />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.85 }} onClick={() => controlAction('next')} className="p-2 rounded-full hover:bg-white/10 active:bg-white/20 transition-colors touch-manipulation">
              <SkipForward className="w-4 h-4 text-gray-500" />
            </motion.button>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 w-24">
            <Volume2 className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <input type="range" min={0} max={100} value={volume} onChange={(e) => { const v = parseInt(e.target.value, 10); setVolume(v); controlAction('volume', v); }} className="w-full h-1 cursor-pointer touch-manipulation" />
          </div>
        </>
      )}

      {!connected && configured && (
        <div className="flex items-center gap-0.5 shrink-0 opacity-40">
          <div className="p-2"><SkipBack className="w-4 h-4 text-gray-600" /></div>
          <div className="p-2.5 rounded-full bg-white/5 border border-white/5"><Play className="w-4 h-4 text-gray-600 ml-0.5" /></div>
          <div className="p-2"><SkipForward className="w-4 h-4 text-gray-600" /></div>
        </div>
      )}
    </LedOverlay>
  );
}
