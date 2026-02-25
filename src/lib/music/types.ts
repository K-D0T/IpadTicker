export interface NowPlaying {
  title: string;
  artist: string;
  album: string;
  albumArtUrl: string | null;
  isPlaying: boolean;
  progressMs: number;
  durationMs: number;
  volumePercent?: number | null;
}

export interface MusicDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export type MusicAction = 'play' | 'pause' | 'next' | 'prev' | 'volume';

export interface MusicControlRequest {
  action: MusicAction;
  value?: number; // for volume 0-100
}

export interface SearchTrack {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  albumArtUrl: string | null;
  durationMs: number;
}
