'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
import MusicPicker from './MusicPicker';
import ThemeSync from './ThemeSync';
import { Settings, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { settings, setSettings, loaded } = useSettings();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [musicExpanded, setMusicExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dashboardPanelRef = useRef<HTMLDivElement>(null);
  const musicPanelRef = useRef<HTMLDivElement>(null);
  const music = useMusicPlayer();

  useEffect(() => {
    const root = scrollRef.current;
    const panel0 = dashboardPanelRef.current;
    const panel1 = musicPanelRef.current;
    if (!root || !panel0 || !panel1) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.5) {
            setPage(entry.target === panel0 ? 0 : 1);
            break;
          }
        }
      },
      { root, rootMargin: '0px', threshold: [0.25, 0.5, 0.75, 1] }
    );
    observer.observe(panel0);
    observer.observe(panel1);
    return () => observer.disconnect();
  }, []);

  const scrollToPage = (index: number) => {
    if (index === 1 && musicPanelRef.current) {
      musicPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      setPage(1);
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    const w = el.clientWidth || el.offsetWidth;
    if (w > 0) {
      el.scrollTo({ left: index * w, behavior: 'smooth' });
      setPage(index);
    }
  };

  if (!loaded) {
    return (
      <div className="h-screen w-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="animate-pulse text-gray-600 text-sm tracking-wider">Loading dashboard...</div>
      </div>
    );
  }

  const canExpand = music.connected && music.track?.isPlaying;

  const applyScene = useCallback((scene: 'custom' | 'game-night' | 'halftime' | 'music-mode') => {
    const sceneToPage = scene === 'music-mode' ? 1 : 0;
    const sceneRefresh = scene === 'game-night' ? 15000 : scene === 'music-mode' ? 60000 : 30000;
    const sceneVolume = scene === 'game-night' ? 70 : scene === 'halftime' ? 45 : scene === 'music-mode' ? 80 : music.volume;

    setSettings((prev) => ({
      ...prev,
      scenePreset: scene,
      refreshInterval: scene === 'custom' ? prev.refreshInterval : sceneRefresh,
    }));

    scrollToPage(sceneToPage);

    if (scene !== 'custom') {
      music.setVolume(sceneVolume);
      void music.controlAction('volume', sceneVolume);
    }
  }, [setSettings, music]);

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

      {/* Page indicator: tappable Dashboard | Music */}
      <div className="flex justify-center items-center gap-2 py-2 shrink-0 border-b border-white/5">
        <button
          type="button"
          onClick={() => scrollToPage(0)}
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors touch-manipulation px-4 py-2 rounded-lg ${
            page === 0 ? 'text-white bg-white/15' : 'text-gray-500 hover:text-gray-400 hover:bg-white/5'
          }`}
        >
          Dashboard
        </button>
        <button
          type="button"
          onClick={() => scrollToPage(1)}
          className={`text-[11px] font-bold uppercase tracking-wider transition-colors touch-manipulation px-4 py-2 rounded-lg flex items-center gap-2 ${
            page === 1 ? 'text-green-400 bg-green-500/25 border border-green-500/30' : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10 border border-transparent'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${page === 1 ? 'bg-green-400' : 'bg-gray-600'}`} />
          Music &amp; Queue
        </button>
      </div>

      {/* Swipeable: Dashboard (0) | Music (1) */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scrollbar-hide snap-x snap-mandatory flex" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div ref={dashboardPanelRef} className="min-w-full w-full flex-shrink-0 flex flex-col min-h-0 snap-start" style={{ minWidth: '100%', width: '100%' }}>
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
                    favoriteTeamIds={settings.favoriteTeamIds}
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
            favoriteTeamIds={settings.favoriteTeamIds}
            alertCloseMargin={settings.alertCloseMargin}
            quietHoursEnabled={settings.quietHoursEnabled}
            quietHoursStart={settings.quietHoursStart}
            quietHoursEnd={settings.quietHoursEnd}
          />
        </div>

        <div
          ref={musicPanelRef}
          className="min-w-full w-full flex-shrink-0 flex flex-col min-h-0 snap-start px-3 pb-2 gap-2"
          style={{ minWidth: '100%', width: '100%' }}
        >
          <div className="flex-1 min-h-0 flex flex-col">
            <MusicPicker music={music} compactLayout />
          </div>
          <p className="text-[10px] text-gray-500 shrink-0 text-center tracking-wider">Swipe right or tap Dashboard to return</p>
        </div>
      </div>

      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        settings={settings}
        onChange={setSettings}
        onApplyScene={applyScene}
      />
    </div>
  );
}
