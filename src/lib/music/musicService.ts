import { NowPlaying, MusicControlRequest } from './types';
import { SpotifyMusicService, isSpotifyConnected } from './spotify';

export interface MusicService {
  getNowPlaying(): Promise<NowPlaying | null>;
  control(req: MusicControlRequest): Promise<void>;
}

export class StubMusicService implements MusicService {
  async getNowPlaying(): Promise<NowPlaying | null> {
    return null;
  }

  async control(_req: MusicControlRequest): Promise<void> {
    throw new Error('Music service not configured. Connect Spotify first.');
  }
}

const spotifyService = new SpotifyMusicService();
const stubService = new StubMusicService();

export function getMusicService(): MusicService {
  if (isSpotifyConnected()) {
    return spotifyService;
  }
  return stubService;
}
