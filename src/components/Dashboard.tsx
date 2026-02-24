'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import NextGameTile from './NextGameTile';
import ClosestGamesTile from './ClosestGamesTile';
import MusicTile from './MusicTile';
import ExtrasTile from './ExtrasTile';
import BottomTicker from './BottomTicker';
import SettingsDrawer from './SettingsDrawer';
import ExpandedMusicPlayer from './ExpandedMusicPlayer';
import ThemeSync from './ThemeSync';
import AppleTVRemote from './AppleTVRemote';
import { Settings, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { settings, setSettings, loaded } = useSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [musicExpanded, setMusicExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const music = useMusicPlayer();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const index = Math.round(el.scrollLeft / el.clientWidth);
      setPage(Math.min(index, 1));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  if (!loaded) {
    return (
      <div className="h-screen w-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-pulse text-gray-600 text-sm tracking-wider">Loading dashboard...</div>
      </div>
    );
  }

  const canExpand = music.connected && music.track?.isPlaying;

  return (
    <div className={`h-screen w-screen bg-[var(--color-background)] flex flex-col overflow-hidden ${settings.kioskMode ? 'kiosk-mode' : ''}`}>
      <ThemeSync lightMode={settings.lightMode} />
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-5 py-1.5 shrink-0 min-h-9">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h1 className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase header-title truncate">Sports & Music</h1>
          {settings.demoMode && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 tracking-wider shrink-0">DEMO</span>
          )}
          {settings.kioskMode && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 tracking-wider shrink-0">KIOSK</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle: pill with Dark / Light */}
          <div
            className="theme-toggle-pill flex rounded-lg bg-white/15 p-0.5 border border-white/25 shadow-sm"
            role="group"
            aria-label="Theme"
          >
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, lightMode: false }))}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors touch-manipulation flex items-center gap-1 ${
                !settings.lightMode ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, lightMode: true }))}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-colors touch-manipulation flex items-center gap-1 ${
                settings.lightMode ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation"
          >
            <Settings className="w-4.5 h-4.5 text-gray-600" />
          </motion.button>
        </div>
      </header>

      {/* Page indicator dots */}
      <div className="flex justify-center gap-1.5 py-1 shrink-0">
        <span className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${page === 0 ? 'bg-gray-400' : 'bg-gray-600'}`} aria-hidden />
        <span className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${page === 1 ? 'bg-gray-400' : 'bg-gray-600'}`} aria-hidden />
      </div>

      {/* Swipeable pages: Dashboard (page 0) | Apple TV (page 1) */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory flex" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Page 0: Dashboard */}
        <div className="min-w-full w-full flex-shrink-0 flex flex-col min-h-0 snap-start">
          <main className="flex-1 flex flex-col gap-2 px-3 pb-1.5 min-h-0">
            <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
              <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
                <AnimatePresence>
                  {musicExpanded && canExpand && (
                    <ExpandedMusicPlayer
                      key="expanded-music"
                      music={music}
                      onCollapse={() => setMusicExpanded(false)}
                    />
                  )}
                </AnimatePresence>
                <div className={`flex-1 min-h-0 ${musicExpanded && canExpand ? 'overflow-y-auto scrollbar-hide' : ''}`}>
                  <NextGameTile
                    refreshInterval={settings.refreshInterval}
                    razorbacksLeague={settings.razorbacksSport}
                    selectedLeagues={settings.selectedLeagues}
                  />
                </div>
              </div>
              <ClosestGamesTile
                leagues={settings.selectedLeagues}
                refreshInterval={settings.refreshInterval}
              />
            </div>
            <div className="shrink-0 grid grid-cols-[1fr_auto] gap-2 items-stretch">
              <MusicTile
                music={music}
                expanded={musicExpanded}
                onToggleExpand={() => setMusicExpanded((prev) => canExpand ? !prev : false)}
              />
              <ExtrasTile />
            </div>
          </main>
          <BottomTicker
            refreshInterval={settings.refreshInterval}
            razorbacksLeague={settings.razorbacksSport}
            leagues={settings.selectedLeagues}
          />
          <p className="text-[9px] text-gray-600 text-center py-1 tracking-wider">Swipe left for Apple TV</p>
        </div>

        {/* Page 1: Apple TV Remote */}
        <div className="min-w-full w-full flex-shrink-0 flex flex-col min-h-0 snap-start justify-center items-center px-4">
          <AppleTVRemote />
          <p className="text-[10px] text-gray-500 mt-2 tracking-wider">Swipe right to return</p>
        </div>
      </div>

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={settings}
        onChange={setSettings}
      />
    </div>
  );
}
