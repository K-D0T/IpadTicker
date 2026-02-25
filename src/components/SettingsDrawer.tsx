'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, RefreshCw, Tv, Trophy, Music, Bell, User, MoonStar } from 'lucide-react';
import { AppSettings } from '@/lib/settings';
import { League } from '@/lib/sports/types';
import { FAVORITE_TEAM_OPTIONS } from '@/lib/sports/favorites';

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
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-cyan-500' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

function SelectRow({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="py-2">
      <p className="text-sm text-gray-300 mb-1.5">{label}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
              value === opt.value
                ? 'bg-cyan-500 text-white'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
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
            className="fixed right-0 top-0 bottom-0 w-[360px] max-w-[90vw] bg-gray-900 border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <MoonStar className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Scene Presets</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('game-night')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${settings.scenePreset === 'game-night' ? 'bg-amber-500 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Game Night
                  </button>
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('halftime')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${settings.scenePreset === 'halftime' ? 'bg-orange-500 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Halftime
                  </button>
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('music-mode')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${settings.scenePreset === 'music-mode' ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Music Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => applySceneAndClose('custom')}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${settings.scenePreset === 'custom' ? 'bg-cyan-500 text-black' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                  >
                    Custom
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Scenes instantly change refresh, alerts, page focus, and target music volume.
                </p>
              </section>

              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Personal Cards</h3>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">Pick up to 6 favorites</p>
                <div className="flex flex-wrap gap-2">
                  {FAVORITE_TEAM_OPTIONS.map((team) => {
                    const selected = settings.favoriteTeamIds.includes(team.id);
                    return (
                      <button
                        type="button"
                        key={team.id}
                        onClick={() => toggleFavoriteTeam(team.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          selected ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                        }`}
                      >
                        {team.label}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mb-6">
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

              <section className="mb-6">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                        settings.selectedLeagues.includes(opt.value)
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="mb-6">
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

              <section className="mb-6">
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
                />
              </section>

              <section className="mb-6 space-y-1">
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
                <section className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-300 font-medium mb-1">Kiosk Mode Active</p>
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
