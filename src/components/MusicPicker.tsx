'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, Loader2, Music, ListOrdered, Sparkles } from 'lucide-react';
import LedOverlay from './LedOverlay';
import PixelLogo from './PixelLogo';
import { MusicPlayerState } from '@/hooks/useMusicPlayer';

interface SearchTrack {
  id: string;
  uri: string;
  name: string;
  artist: string;
  album: string;
  albumArtUrl: string | null;
  durationMs: number;
}

const DEBOUNCE_MS = 350;

function TrackRow({
  track,
  onAdd,
  addingId,
  addedId,
  showAdd,
}: {
  track: SearchTrack;
  onAdd: (t: SearchTrack) => void;
  addingId: string | null;
  addedId: string | null;
  showAdd: boolean;
}) {
  const artSrc = track.albumArtUrl ? `/api/img?url=${encodeURIComponent(track.albumArtUrl)}` : '';
  const isAdding = addingId === track.id;
  const justAdded = addedId === track.id;
  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03]">
      <div className="w-10 h-10 shrink-0 rounded overflow-hidden bg-white/5">
        {artSrc ? (
          <PixelLogo src={artSrc} size={40} pixelResolution={12} className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-5 h-5 text-gray-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{track.name}</p>
        <p className="text-[11px] text-gray-500 truncate">{track.artist}</p>
      </div>
      {showAdd && (
        <button
          type="button"
          onClick={() => onAdd(track)}
          disabled={isAdding}
          className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors touch-manipulation ${
            justAdded
              ? 'bg-green-500/30 text-green-400'
              : 'bg-green-500/20 text-green-400/90 hover:bg-green-500/30 border border-green-500/30'
          }`}
        >
          {isAdding ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : justAdded ? (
            'Added'
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Add
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function MusicPicker({ music }: { music: MusicPlayerState }) {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<SearchTrack[]>([]);
  const [queue, setQueue] = useState<SearchTrack[]>([]);
  const [recommended, setRecommended] = useState<SearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setTracks([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}&limit=15`);
      const data = await res.json();
      setTracks(data.tracks ?? []);
    } catch {
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/music/queue-list');
      const data = await res.json();
      setQueue(data.queue ?? []);
    } catch {
      setQueue([]);
    }
  }, []);

  const fetchRecommended = useCallback(async () => {
    try {
      const res = await fetch('/api/music/recommendations');
      const data = await res.json();
      setRecommended(data.tracks ?? []);
    } catch {
      setRecommended([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setTracks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    if (!music.connected) return;
    fetchQueue();
    fetchRecommended();
    const t = setInterval(fetchQueue, 15000);
    return () => clearInterval(t);
  }, [music.connected, fetchQueue, fetchRecommended]);

  const addToQueue = useCallback(async (track: SearchTrack) => {
    setAddingId(track.id);
    setAddedId(null);
    try {
      const res = await fetch('/api/music/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: track.uri }),
      });
      if (res.ok) {
        setAddedId(track.id);
        music.poll();
        fetchQueue();
        setTimeout(() => setAddedId(null), 2000);
      }
    } catch {
      // ignore
    } finally {
      setAddingId(null);
    }
  }, [music, fetchQueue]);

  if (!music.connected) {
    return (
      <LedOverlay className="tile-card rounded-xl border border-white/10 p-4" intensity={0.08}>
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Music className="w-4 h-4" />
          Connect Spotify to search and add songs to your queue.
        </p>
      </LedOverlay>
    );
  }

  return (
    <LedOverlay className="tile-card rounded-xl border border-white/10 flex flex-col overflow-hidden" intensity={0.08}>
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide flex flex-col gap-4">
        {/* Queue */}
        <div className="shrink-0">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-3 flex items-center gap-2">
            <ListOrdered className="w-3.5 h-3.5" />
            Up next
          </h3>
          {queue.length === 0 ? (
            <p className="text-[11px] text-gray-600 px-3 py-2">Queue is empty — add tracks below</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {queue.slice(0, 8).map((track) => (
                <li key={track.id}>
                  <TrackRow track={track} onAdd={addToQueue} addingId={null} addedId={null} showAdd={false} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recommended */}
        <div className="shrink-0">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            Recommended for you
          </h3>
          {recommended.length === 0 ? (
            <p className="text-[11px] text-gray-600 px-3 py-2">Loading…</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {recommended.slice(0, 10).map((track) => (
                <li key={track.id}>
                  <TrackRow track={track} onAdd={addToQueue} addingId={addingId} addedId={addedId} showAdd />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search */}
        <div className="shrink-0 pb-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-3 flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            Add to queue
          </h3>
          <div className="px-3 mb-2">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tracks..."
                className="w-full rounded-lg bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/30 focus:ring-1 focus:ring-green-500/20"
                aria-label="Search tracks"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-green-500/70 animate-spin" />
            </div>
          )}
          {!loading && query.trim() && tracks.length === 0 && (
            <p className="text-xs text-gray-500 py-4 text-center">No results</p>
          )}
          {!loading && tracks.length > 0 && (
            <ul className="divide-y divide-white/5">
              {tracks.map((track) => (
                <li key={track.id}>
                  <TrackRow track={track} onAdd={addToQueue} addingId={addingId} addedId={addedId} showAdd />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </LedOverlay>
  );
}
