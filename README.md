# iPad Sports + Music Dashboard

A responsive, iPad-first dashboard built with Next.js that shows live sports scores, upcoming games for your favorite teams, and a music control center.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. On iPad, use Safari and "Add to Home Screen" for a full-screen PWA experience.

## Environment Variables

Create `.env.local` in the project root:

```env
# Set to "true" to force mock/demo data (recommended for first run)
DEMO_MODE=true

# ESPN base URL (public, no API key needed)
ESPN_BASE_URL=https://site.api.espn.com/apis/site/v2/sports

# Cache TTL in milliseconds (default: 20000)
CACHE_TTL_MS=20000

# Spotify (future integration)
# SPOTIFY_CLIENT_ID=
# SPOTIFY_CLIENT_SECRET=
# SPOTIFY_REDIRECT_URI=
```

## Features

### Dashboard Tiles (2x2 Grid)

| Tile | Description |
|------|-------------|
| **Next Games** | Upcoming Ravens + Razorbacks games with countdown timers |
| **Closest Games** | Live games sorted by score proximity (nail-biters first) |
| **Music** | Play/pause/skip controls (Spotify integration placeholder) |
| **Dashboard** | Clock, date, weather placeholder |

### Bottom Ticker
Rotating banner that cycles through:
- Next Ravens game with countdown
- Next Razorbacks game with countdown
- Closest live game for each selected league

### Settings Drawer
Tap the gear icon to configure:
- **Razorbacks Sport**: NCAA Basketball (default) or Football
- **Leagues**: Toggle NFL, NCAA Football, NCAA Basketball for closest games
- **Refresh Interval**: 15s, 30s, or 60s
- **Demo Mode**: Use mock data instead of live ESPN feeds
- **Kiosk Mode**: Hides scrollbars, full-screen optimized

Settings persist in `localStorage`.

## Demo Mode

Demo Mode is enabled by default. It returns realistic mock data for all endpoints so you can see the dashboard working immediately without depending on live APIs.

Toggle it from:
- `.env.local`: Set `DEMO_MODE=true` (server-side, all clients)
- Settings drawer: Toggle "Demo Mode" (client-side preference; the server `DEMO_MODE` env var takes priority)

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── sports/
│   │   │   ├── next/route.ts    GET /api/sports/next?team=ravens|razorbacks
│   │   │   └── close/route.ts   GET /api/sports/close?league=nfl|ncaaf|ncaam
│   │   └── music/
│   │       ├── now-playing/route.ts  GET /api/music/now-playing
│   │       └── control/route.ts      POST /api/music/control
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Dashboard.tsx          Main layout orchestrator
│   ├── NextGameTile.tsx       Favorite team next games
│   ├── ClosestGamesTile.tsx   Live games sorted by closeness
│   ├── MusicTile.tsx          Music player controls
│   ├── ExtrasTile.tsx         Clock + weather placeholder
│   ├── BottomTicker.tsx       Rotating message bar
│   ├── SettingsDrawer.tsx     Settings panel
│   └── LoadingSkeleton.tsx    Loading states
├── hooks/
│   ├── useSettings.ts         localStorage settings hook
│   └── usePolling.ts          Auto-refresh data hook
└── lib/
    ├── cache.ts               In-memory TTL cache
    ├── settings.ts            Settings types and persistence
    ├── sports/
    │   ├── types.ts           Game, Team, League types
    │   ├── sportsService.ts   Business logic layer
    │   └── providers/
    │       ├── provider.interface.ts  Provider contract
    │       ├── espn.provider.ts       ESPN public API
    │       ├── mock.provider.ts       Mock/demo data
    │       └── index.ts              Provider factory
    └── music/
        ├── types.ts           Music types
        └── musicService.ts    Music service interface
```

## Provider Design

### Interface
All sports data providers implement `SportsProvider`:
```typescript
interface SportsProvider {
  name: string;
  getScoreboard(league: League): Promise<Game[]>;
  getTeamSchedule(league: League, teamKey: string): Promise<Game[]>;
}
```

### ESPN Provider
Uses ESPN's public scoreboard endpoints (no API key required):
- NFL: `site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- NCAA Football: `.../football/college-football/scoreboard`
- NCAA Basketball: `.../basketball/mens-college-basketball/scoreboard`

If ESPN endpoints fail, the system automatically falls back to MockProvider.

### Mock Provider
Returns realistic data for development and demo purposes. Always available as a fallback.

### Adding a New Provider
1. Create `src/lib/sports/providers/your-provider.ts`
2. Implement the `SportsProvider` interface
3. Update the factory in `providers/index.ts`

## Caching

Server-side responses are cached with a configurable TTL (default 20s). The cache is in-memory and resets on server restart. This prevents excessive calls to upstream APIs during rapid client polling.

## API Routes

| Method | Path | Params | Description |
|--------|------|--------|-------------|
| GET | `/api/sports/next` | `team` (ravens\|razorbacks), `league?` | Next upcoming game |
| GET | `/api/sports/close` | `league` (nfl\|ncaaf\|ncaam), `limit?` | Closest live games |
| GET | `/api/music/now-playing` | — | Current track (stub: 501) |
| POST | `/api/music/control` | `action`, `value?` | Playback control (stub: 501) |

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```
Set environment variables in the Vercel dashboard.

### LAN Access (for iPad on same network)
```bash
npm run dev -- -H 0.0.0.0
```
Then open `http://<your-computer-ip>:3000` on iPad Safari.

### iPad Setup
1. Open the dashboard URL in Safari
2. Tap Share → "Add to Home Screen"
3. For kiosk mode: Settings → Accessibility → Guided Access → On
4. Open the app from Home Screen
5. Triple-click side button to start Guided Access

## Apple TV Remote (optional)

Swipe left on the dashboard to open the Apple TV remote. It sends commands through the **server** to your Apple TV, so the machine running this app must be on the **same network** as the Apple TV.

### Enabling Apple TV control

1. **Pair once** (on a machine that can run `node-appletv`):
   ```bash
   npx node-appletv scan
   npx node-appletv pair <device-id>
   ```
   Copy the credentials string it prints.

2. **Configure** in `.env.local`:
   ```env
   APPLETV_CREDENTIALS=<paste-credentials-here>
   ```

3. **Install the dependency** (see below for Windows).

### Apple TV on Windows

`node-appletv` depends on the native package **sodium**, which needs C++ build tools on Windows. You have two options:

**Option A – Use Visual Studio Build Tools**

1. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the “Desktop development with C++” workload (or “C++ build tools”).
2. In the project root, ensure `.npmrc` contains (use 2019 or 2022 to match your install):
   ```
   msvs_version=2022
   ```
3. Install the optional dependency **without** running its install scripts (so the buggy `sodium` script doesn’t run yet):
   ```bash
   npm install node-appletv --ignore-scripts
   ```
4. Fix and build the `sodium` native module:
   ```bash
   node scripts/fix-sodium-install.js
   ```
   Then finish by running (no flags this time):
   ```bash
   npm install node-appletv
   ```
   If you already ran `npm install node-appletv` and it failed, run step 3 with `--ignore-scripts`, then step 4.

**Option B – Run the app elsewhere for Apple TV**

- Run this Next.js app on a **Mac or Linux** machine (or Raspberry Pi) on the same LAN as the Apple TV. Pair and set `APPLETV_CREDENTIALS` there. Your iPad can still open the dashboard via ngrok or LAN; the server that has `node-appletv` installed is the one that talks to the Apple TV.

Without `node-appletv` installed, the remote UI still works (swipe, buttons); tapping buttons will show “Apple TV not set up” until the server has the dependency and credentials.

## Tech Stack
- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS 4**
- **Framer Motion** (animations)
- **Lucide React** (icons)
