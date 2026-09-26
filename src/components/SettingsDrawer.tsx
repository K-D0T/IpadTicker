'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, RefreshCw, Tv, Trophy, Music, Bell, User, MoonStar } from 'lucide-react';
import { AppSettings } from '@/lib/settings';
import { League } from '@/lib/sports/types';
import { FAVORITE_TEAM_GROUPS } from '@/lib/sports/favorites';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onApplyScene: (scene: AppSettings['scenePreset']) => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer touch-manipulation">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-checked={checked}
        onClick={() => onChange(!checked)}
        className="glow-toggle touch-manipulation"
      >
        <span className="glow-toggle-knob" />
      </button>
    </label>
  );
}

function SelectRow({ label, value, options, onChange, glow = 'cyan' }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  glow?: 'cyan' | 'amber' | 'orange' | 'green';
}) {
  return (
    <div className="py-2">
      {label && <p className="text-sm text-gray-300 mb-1.5">{label}</p>}
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            data-glow={glow}
            className={`glow-pill min-h-11 flex items-center justify-center px-3 py-1.5 text-xs font-bold tracking-wide touch-manipulation ${
              value === opt.value ? 'glow-pill-active' : ''
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SettingsDrawer({ open, onClose, settings, onChange, onApplyScene }: SettingsDrawerProps) {
  const update = (partial: Partial<AppSettings>) => {
    onChange({ ...settings, ...partial });
  };

  const toggleLeague = (league: League) => {
    const current = settings.selectedLeagues;
    const next = current.includes(league)
      ? current.filter((l) => l !== league)
      : [...current, league];
    if (next.length > 0) update({ selectedLeagues: next });
  };

  const toggleFavoriteTeam = (id: string) => {
    const current = settings.favoriteTeamIds;
    const exists = current.includes(id);
    if (exists) {
      if (current.length === 1) return;
      update({ favoriteTeamIds: current.filter((x) => x !== id) });
      return;
    }
    if (current.length >= 6) return;
    update({ favoriteTeamIds: [...current, id] });
  };

  const applySceneAndClose = (scene: AppSettings['scenePreset']) => {
    onApplyScene(scene);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="drawer-glass fixed right-0 top-0 bottom-0 w-[360px] max-w-[90vw] z-50 overflow-y-auto scrollbar-hide relative"
          >
            <div className="led-dots pointer-events-none absolute inset-0 z-0" style={{ opacity: 0.05 }} />
            <div className="relative z-10 p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase header-title">Settings</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <section className="drawer-section mb-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MoonStar className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Scene Presets</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('game-night')}
                    data-glow="amber"
                    className={`glow-pill min-h-11 flex items-center justify-center px-3 py-2 text-xs font-bold tracking-wide ${settings.scenePreset === 'game-night' ? 'glow-pill-active' : ''}`}
                  >
                    Game Night
                  </button>
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('halftime')}
                    data-glow="orange"
                    className={`glow-pill min-h-11 flex items-center justify-center px-3 py-2 text-xs font-bold tracking-wide ${settings.scenePreset === 'halftime' ? 'glow-pill-active' : ''}`}
                  >
                    Halftime
                  </button>
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('music-mode')}
                    data-glow="green"
                    className={`glow-pill min-h-11 flex items-center justify-center px-3 py-2 text-xs font-bold tracking-wide ${settings.scenePreset === 'music-mode' ? 'glow-pill-active' : ''}`}
                  >
                    Music Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('custom')}
                    data-glow="cyan"
                    className={`glow-pill min-h-11 flex items-center justify-center px-3 py-2 text-xs font-bold tracking-wide ${settings.scenePreset === 'custom' ? 'glow-pill-active' : ''}`}
                  >
                    Custom
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Scenes instantly change refresh, alerts, page focus, and target music volume.
                </p>
              </section>

              <section className="drawer-section mb-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Personal Cards</h3>
                </div>
                <p className="text-[11px] text-gray-500 mb-3">
                  Pick up to 6 favorites <span className="text-gray-400 font-semibold">({settings.favoriteTeamIds.length}/6 selected)</span>
                </p>
                <div className="space-y-4">
                  {FAVORITE_TEAM_GROUPS.map((group) => (
                    <div key={group.league}>
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-600 mb-1.5">{group.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {group.teams.map((team) => {
                          const selected = settings.favoriteTeamIds.includes(team.id);
                          return (
                            <button
                              type="button"
                              key={team.id}
                              onClick={() => toggleFavoriteTeam(team.id)}
                              data-glow="cyan"
                              className={`glow-pill min-h-11 flex items-center justify-center px-2.5 py-1.5 text-[11px] font-bold tracking-wide ${selected ? 'glow-pill-active' : ''}`}
                            >
                              {team.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="drawer-section mb-6 pb-6">
                <SelectRow
                  label="Razorbacks Sport"
                  value={settings.razorbacksSport}
                  options={[
                    { value: 'ncaam', label: 'Basketball' },
                    { value: 'ncaaf', label: 'Football' },
                  ]}
                  onChange={(v) => update({ razorbacksSport: v as 'ncaam' | 'ncaaf' })}
                />
              </section>

              <section className="drawer-section mb-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tv className="w-4 h-4 text-orange-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Closest Games Leagues</h3>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: 'nfl' as League, label: 'NFL' },
                    { value: 'ncaaf' as League, label: 'NCAA Football' },
                    { value: 'ncaam' as League, label: 'NCAA Basketball' },
                  ]).map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => toggleLeague(opt.value)}
                      data-glow="orange"
                      className={`glow-pill min-h-11 flex items-center justify-center px-3 py-1.5 text-xs font-bold tracking-wide touch-manipulation ${
                        settings.selectedLeagues.includes(opt.value) ? 'glow-pill-active' : ''
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="drawer-section mb-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-red-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Alert Controls</h3>
                </div>
                <SelectRow
                  label="Close Game Margin"
                  value={String(settings.alertCloseMargin)}
                  options={[
                    { value: '2', label: '2 pts' },
                    { value: '3', label: '3 pts' },
                    { value: '5', label: '5 pts' },
                    { value: '7', label: '7 pts' },
                  ]}
                  onChange={(v) => update({ alertCloseMargin: parseInt(v, 10) })}
                />
                <Toggle
                  label="Quiet Hours"
                  checked={settings.quietHoursEnabled}
                  onChange={(v) => update({ quietHoursEnabled: v })}
                />
                {settings.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <label className="text-[11px] text-gray-500">
                      Start
                      <input
                        type="time"
                        value={settings.quietHoursStart}
                        onChange={(e) => update({ quietHoursStart: e.target.value })}
                        className="mt-1 w-full rounded bg-white/10 border border-white/10 px-2 py-1 text-xs text-gray-200"
                      />
                    </label>
                    <label className="text-[11px] text-gray-500">
                      End
                      <input
                        type="time"
                        value={settings.quietHoursEnd}
                        onChange={(e) => update({ quietHoursEnd: e.target.value })}
                        className="mt-1 w-full rounded bg-white/10 border border-white/10 px-2 py-1 text-xs text-gray-200"
                      />
                    </label>
                  </div>
                )}
              </section>

              <section className="drawer-section mb-6 pb-6">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-green-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Refresh Interval</h3>
                </div>
                <SelectRow
                  label=""
                  value={String(settings.refreshInterval)}
                  options={[
                    { value: '15000', label: '15s' },
                    { value: '30000', label: '30s' },
                    { value: '60000', label: '60s' },
                  ]}
                  onChange={(v) => update({ refreshInterval: parseInt(v, 10) })}
                  glow="green"
                />
              </section>

              <section className="drawer-section mb-6 pb-6 space-y-1">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Display</h3>
                </div>
                <Toggle
                  label="Light Mode"
                  checked={settings.lightMode}
                  onChange={(v) => update({ lightMode: v })}
                />
                <Toggle
                  label="Demo Mode"
                  checked={settings.demoMode}
                  onChange={(v) => update({ demoMode: v })}
                />
                <Toggle
                  label="Kiosk Mode"
                  checked={settings.kioskMode}
                  onChange={(v) => update({ kioskMode: v })}
                />
              </section>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-green-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Spotify</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Use scene presets to set dashboard page plus target volume.
                </p>
              </section>

              {settings.kioskMode && (
                <section className="glow-pill glow-pill-active p-3" data-glow="purple">
                  <p className="text-xs text-purple-300 font-bold tracking-wide mb-1">Kiosk Mode Active</p>
                  <p className="text-[10px] text-purple-400/70 leading-relaxed">
                    For iPad: Add to Home Screen, then enable Guided Access in Accessibility settings.
                  </p>
                </section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
