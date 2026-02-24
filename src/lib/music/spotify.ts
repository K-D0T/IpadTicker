import { NowPlaying, MusicControlRequest } from './types';
import { MusicService } from './musicService';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';
const TOKEN_FILE = path.join(process.cwd(), '.spotify-tokens.json');

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Survive Next.js HMR by storing on globalThis
const globalKey = '__spotify_tokens__' as const;
declare global {
  // eslint-disable-next-line no-var
  var __spotify_tokens__: SpotifyTokens | null | undefined;
}

function getTokens(): SpotifyTokens | null {
  if (globalThis[globalKey]) return globalThis[globalKey]!;

  // Try loading from disk on cold start
  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const raw = fs.readFileSync(TOKEN_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as SpotifyTokens;
      if (parsed.refreshToken) {
        globalThis[globalKey] = parsed;
        return parsed;
      }
    }
  } catch { /* ignore corrupt file */ }

  return null;
}

function saveTokens(t: SpotifyTokens) {
  globalThis[globalKey] = t;
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Spotify] Could not persist tokens to disk:', err);
  }
}

function getClientId() { return process.env.SPOTIFY_CLIENT_ID || ''; }
function getClientSecret() { return process.env.SPOTIFY_CLIENT_SECRET || ''; }
function getRedirectUri() { return process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/music/callback'; }

export function getSpotifyAuthUrl(): string {
  const scopes = [
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: getClientId(),
    scope: scopes,
    redirect_uri: getRedirectUri(),
    show_dialog: 'true',
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<SpotifyTokens> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token exchange failed: ${err}`);
  }

  const data = await res.json();
  const tokens: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveTokens(tokens);
  return tokens;
}

async function refreshAccessToken(): Promise<void> {
  const tokens = getTokens();
  if (!tokens?.refreshToken) throw new Error('No refresh token available');

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${getClientId()}:${getClientSecret()}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refreshToken,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Spotify token refresh failed: ${err}`);
  }

  const data = await res.json();
  const updated: SpotifyTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || tokens.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  saveTokens(updated);
}

async function getAccessToken(): Promise<string> {
  const tokens = getTokens();
  if (!tokens) throw new Error('Spotify not connected');
  if (Date.now() >= tokens.expiresAt - 60000) {
    await refreshAccessToken();
  }
  return getTokens()!.accessToken;
}

async function spotifyFetch(urlPath: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${API_BASE}${urlPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export function isSpotifyConnected(): boolean {
  return getTokens() !== null;
}

export function setTokens(t: SpotifyTokens) {
  saveTokens(t);
}

export class SpotifyMusicService implements MusicService {
  async getNowPlaying(): Promise<NowPlaying | null> {
    const res = await spotifyFetch('/me/player/currently-playing');

    if (res.status === 204 || res.status === 202) return null;
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.item) return null;

    const track = data.item;
    return {
      title: track.name || 'Unknown',
      artist: track.artists?.map((a: { name: string }) => a.name).join(', ') || 'Unknown',
      album: track.album?.name || '',
      albumArtUrl: track.album?.images?.[0]?.url || null,
      isPlaying: data.is_playing ?? false,
      progressMs: data.progress_ms ?? 0,
      durationMs: track.duration_ms ?? 0,
    };
  }

  async control(req: MusicControlRequest): Promise<void> {
    switch (req.action) {
      case 'play':
        await spotifyFetch('/me/player/play', { method: 'PUT' });
        break;
      case 'pause':
        await spotifyFetch('/me/player/pause', { method: 'PUT' });
        break;
      case 'next':
        await spotifyFetch('/me/player/next', { method: 'POST' });
        break;
      case 'prev':
        await spotifyFetch('/me/player/previous', { method: 'POST' });
        break;
      case 'volume':
        if (req.value != null) {
          await spotifyFetch(`/me/player/volume?volume_percent=${req.value}`, { method: 'PUT' });
        }
        break;
    }
  }
}
