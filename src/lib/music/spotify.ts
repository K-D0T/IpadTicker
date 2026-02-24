import { NowPlaying, MusicControlRequest, SearchTrack } from './types';
import { MusicService } from './musicService';
import * as fs from 'fs';
import * as path from 'path';
import { AsyncLocalStorage } from 'async_hooks';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const API_BASE = 'https://api.spotify.com/v1';
const TOKEN_FILE = path.join(process.cwd(), '.spotify-tokens.json');

const COOKIE_REFRESH = 'spotify_refresh';
const COOKIE_ACCESS = 'spotify_access';
const COOKIE_EXPIRES = 'spotify_expires';
const COOKIE_OPTS = 'Path=/; HttpOnly; SameSite=Lax; Max-Age=';
const REFRESH_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const ACCESS_MAX_AGE = 55 * 60; // 55 min (refresh before 1h)

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export type CookieStore = { get: (name: string) => { value: string } | undefined };

/** Build a cookie store from a Request Cookie header (fallback when cookies() is empty in Route Handlers). */
export function cookieStoreFromRequest(request: Request): CookieStore {
  const header = request.headers.get('cookie');
  const parsed: Record<string, string> = {};
  if (header) {
    for (const part of header.split(';')) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const name = decodeURIComponent(part.slice(0, eq).trim());
      const value = decodeURIComponent(part.slice(eq + 1).trim());
      if (name) parsed[name] = value;
    }
  }
  return {
    get(name: string) {
      const value = parsed[name];
      return value !== undefined ? { value } : undefined;
    },
  };
}

const globalKey = '__spotify_tokens__' as const;
const pendingKey = '__spotify_pending_cookie__' as const;
declare global {
  // eslint-disable-next-line no-var
  var __spotify_tokens__: SpotifyTokens | null | undefined;
  // eslint-disable-next-line no-var
  var __spotify_pending_cookie__: SpotifyTokens | null | undefined;
}

const spotifyStorage = new AsyncLocalStorage<{ cookies: CookieStore }>();

export function runWithCookies<T>(cookies: CookieStore, fn: () => T): T {
  return spotifyStorage.run({ cookies }, fn);
}

/** Use for async handlers so the whole promise runs inside cookie context. */
export function runWithCookiesAsync<T>(cookies: CookieStore, fn: () => Promise<T>): Promise<T> {
  return spotifyStorage.run({ cookies }, () => fn());
}

export function getPendingCookieUpdate(): SpotifyTokens | null {
  const v = globalThis[pendingKey] ?? null;
  globalThis[pendingKey] = undefined;
  return v;
}

function getTokens(): SpotifyTokens | null {
  if (globalThis[globalKey]) return globalThis[globalKey]!;

  const store = spotifyStorage.getStore();
  if (store?.cookies) {
    const refresh = store.cookies.get(COOKIE_REFRESH)?.value;
    if (refresh) {
      const access = store.cookies.get(COOKIE_ACCESS)?.value;
      const expiresStr = store.cookies.get(COOKIE_EXPIRES)?.value;
      const expiresAt = expiresStr ? parseInt(expiresStr, 10) : 0;
      if (access && expiresAt > Date.now() + 60000) {
        return { accessToken: access, refreshToken: refresh, expiresAt };
      }
      return { accessToken: '', refreshToken: refresh, expiresAt: 0 };
    }
    // Cookies context but no refresh (e.g. Next.js empty in Route Handler) — fall through to file
  }

  try {
    if (fs.existsSync(TOKEN_FILE)) {
      const raw = fs.readFileSync(TOKEN_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as SpotifyTokens;
      if (parsed.refreshToken) {
        globalThis[globalKey] = parsed;
        return parsed;
      }
    }
  } catch { /* ignore */ }

  return null;
}

function saveTokens(t: SpotifyTokens) {
  globalThis[globalKey] = t;
  try {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(t, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Spotify] Could not persist tokens to disk:', err);
  }
  const store = spotifyStorage.getStore();
  if (store?.cookies) {
    globalThis[pendingKey] = t;
  }
}

function getClientId() { return process.env.SPOTIFY_CLIENT_ID || ''; }
function getClientSecret() { return process.env.SPOTIFY_CLIENT_SECRET || ''; }
function getRedirectUri() { return process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/music/callback'; }

function tokenCookies(t: SpotifyTokens, secure = false): string[] {
  const secureFlag = secure ? '; Secure' : '';
  return [
    `${COOKIE_REFRESH}=${encodeURIComponent(t.refreshToken)}; ${COOKIE_OPTS}${REFRESH_MAX_AGE}${secureFlag}`,
    `${COOKIE_ACCESS}=${encodeURIComponent(t.accessToken)}; ${COOKIE_OPTS}${ACCESS_MAX_AGE}${secureFlag}`,
    `${COOKIE_EXPIRES}=${t.expiresAt}; ${COOKIE_OPTS}${ACCESS_MAX_AGE}${secureFlag}`,
  ];
}

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

/** Returns Set-Cookie header values (one per cookie) for the response. */
export function getSpotifyCookieHeaders(tokens: SpotifyTokens, secure = false): string[] {
  return tokenCookies(tokens, secure);
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

  async searchTracks(q: string, limit = 20): Promise<SearchTrack[]> {
    if (!q.trim()) return [];
    const params = new URLSearchParams({
      q: q.trim(),
      type: 'track',
      limit: String(Math.min(limit, 30)),
    });
    const res = await spotifyFetch(`/search?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const items = data.tracks?.items ?? [];
    return items.map((t: {
      id: string;
      uri: string;
      name: string;
      artists: { name: string }[];
      album: { name: string; images?: { url: string }[] };
      duration_ms: number;
    }) => ({
      id: t.id,
      uri: t.uri,
      name: t.name || 'Unknown',
      artist: t.artists?.map((a) => a.name).join(', ') || 'Unknown',
      album: t.album?.name || '',
      albumArtUrl: t.album?.images?.[0]?.url ?? null,
      durationMs: t.duration_ms ?? 0,
    }));
  }

  async addToQueue(uri: string): Promise<void> {
    if (!uri.trim()) return;
    const encoded = encodeURIComponent(uri.trim());
    const res = await spotifyFetch(`/me/player/queue?uri=${encoded}`, { method: 'POST' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to add to queue');
    }
  }

  async playTrack(uri: string): Promise<void> {
    if (!uri.trim()) return;
    const res = await spotifyFetch('/me/player/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: [uri.trim()] }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Failed to play track');
    }
  }

  async skipToQueueIndex(index: number): Promise<void> {
    if (index <= 0) return;
    for (let i = 0; i < index; i++) {
      await spotifyFetch('/me/player/next', { method: 'POST' });
    }
  }

  async getQueue(): Promise<SearchTrack[]> {
    const res = await spotifyFetch('/me/player/queue');
    if (res.status === 204 || !res.ok) return [];
    const data = await res.json();
    const queue = data.queue ?? [];
    return queue.map((t: {
      id: string;
      uri: string;
      name: string;
      artists: { name: string }[];
      album: { name: string; images?: { url: string }[] };
      duration_ms: number;
    }) => ({
      id: t.id,
      uri: t.uri,
      name: t.name || 'Unknown',
      artist: t.artists?.map((a) => a.name).join(', ') || 'Unknown',
      album: t.album?.name || '',
      albumArtUrl: t.album?.images?.[0]?.url ?? null,
      durationMs: t.duration_ms ?? 0,
    }));
  }

  async getRecommendations(seedTrackId?: string | null): Promise<SearchTrack[]> {
    let seed = seedTrackId?.trim();
    if (!seed) {
      const np = await spotifyFetch('/me/player/currently-playing');
      if (np.ok && np.status !== 204) {
        try {
          const data = await np.json();
          seed = data.item?.id ?? '';
        } catch {
          // no body or invalid JSON
        }
      }
    }
    const params = new URLSearchParams({ limit: '15', market: 'US' });
    if (seed) {
      params.set('seed_tracks', seed);
    } else {
      params.set('seed_genres', 'pop');
    }
    const url = `/recommendations?${params.toString()}`;
    const res = await spotifyFetch(url);
    if (!res.ok) {
      const errText = await res.text();
      console.warn('[Spotify] recommendations failed', res.status, url, errText.slice(0, 300));
      return [];
    }
    type RecommendationTrack = {
      id: string;
      uri: string;
      name: string;
      artists?: { name: string }[];
      album?: { name: string; images?: { url: string }[] };
      duration_ms?: number;
    };
    let data: { tracks?: RecommendationTrack[] };
    try {
      data = await res.json();
    } catch (e) {
      console.warn('[Spotify] recommendations parse error', e);
      return [];
    }
    const items: RecommendationTrack[] = Array.isArray(data.tracks) ? data.tracks : [];
    return items.map((t) => ({
      id: t.id,
      uri: t.uri,
      name: t.name || 'Unknown',
      artist: t.artists?.map((a) => a.name).join(', ') || 'Unknown',
      album: t.album?.name || '',
      albumArtUrl: t.album?.images?.[0]?.url ?? null,
      durationMs: t.duration_ms ?? 0,
    }));
  }
}
