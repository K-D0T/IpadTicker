'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, RefreshCw, Tv, Trophy, Music } from 'lucide-react';
import { AppSettings } from '@/lib/settings';
import { League } from '@/lib/sports/types';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer touch-manipulation">
      <span className="text-sm text-gray-300">{label}</span>
      <button
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

export default function SettingsDrawer({ open, onClose, settings, onChange }: SettingsDrawerProps) {
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[340px] max-w-[85vw] bg-gray-900 border-l border-white/10 z-50 overflow-y-auto"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Favorite Teams */}
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Favorite Teams</h3>
                </div>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center gap-2 py-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-sm text-gray-300">Baltimore Ravens</span>
                    <span className="ml-auto text-[10px] text-gray-500">NFL</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-gray-300">Arkansas Razorbacks</span>
                    <span className="ml-auto text-[10px] text-gray-500">
                      {settings.razorbacksSport === 'ncaam' ? 'Basketball' : 'Football'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Razorbacks Sport */}
              <section className="mb-6">
                <SelectRow
                  label="Razorbacks Sport"
                  value={settings.razorbacksSport}
                  options={[
                    { value: 'ncaam', label: '🏀 Basketball' },
                    { value: 'ncaaf', label: '🏈 Football' },
                  ]}
                  onChange={(v) => update({ razorbacksSport: v as 'ncaam' | 'ncaaf' })}
                />
              </section>

              {/* League Selection */}
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

              {/* Refresh Interval */}
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

              {/* Toggles */}
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

              {/* Music */}
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Music className="w-4 h-4 text-green-400" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Spotify</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Spotify integration coming soon. Configure credentials in <code className="text-gray-400">.env.local</code>
                </p>
              </section>

              {/* Kiosk Mode Info */}
              {settings.kioskMode && (
                <section className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <p className="text-xs text-purple-300 font-medium mb-1">Kiosk Mode Active</p>
                  <p className="text-[10px] text-purple-400/70 leading-relaxed">
                    For iPad: Add to Home Screen → Settings → Accessibility → Guided Access → Turn On.
                    Triple-click home/side button to start Guided Access.
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
