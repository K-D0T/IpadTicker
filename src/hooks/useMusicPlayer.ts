'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NowPlaying {
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
}

export interface MusicPlayerState {
  track: NowPlaying | null;
  connected: boolean;
  configured: boolean;
  volume: number;
  setVolume: (v: number) => void;
  controlAction: (action: string, value?: number) => Promise<void>;
  poll: () => Promise<void>;
}

export function useMusicPlayer(): MusicPlayerState {
  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [connected, setConnected] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [volume, setVolume] = useState(70);

  const poll = useCallback(async () => {
    try {
      const statusRes = await fetch('/api/music/status');
      const status = await statusRes.json();
      setConnected(status.connected);
      setConfigured(status.configured);

      if (!status.connected) {
        setTrack(null);
        return;
      }

      const res = await fetch('/api/music/now-playing');
      const data = await res.json();
      setTrack(data.nowPlaying || null);
    } catch {
      setTrack(null);
    }
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [poll]);

  const controlAction = useCallback(async (action: string, value?: number) => {
    try {
      await fetch('/api/music/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, value }),
      });
      setTimeout(poll, 300);
    } catch { /* */ }
  }, [poll]);

  return { track, connected, configured, volume, setVolume, controlAction, poll };
}
