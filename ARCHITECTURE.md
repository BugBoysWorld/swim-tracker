# Swim Tracker — Architecture Document

**Version:** 1.1
**Date:** April 2026
**Live URL:** https://swim-tracker.pages.dev
**API URL:** N/A — fully client-side, no backend

---

## 1. System Overview

Swim Tracker is a mobile-first single-page application for competitive swim coaches. It allows coaches to record swimmer times, load competitor field times for any event, and instantly see where each swimmer places within the field (#N of M). The entire app runs in the browser with no server — all state is stored in `localStorage` and all placement calculations happen client-side. It is designed for use at swim meets where connectivity may be unreliable, so it is a Tier 1 Full PWA: installable, offline-capable, and functional without a network connection.

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| UI | React 18 | Component rendering, state, effects |
| Build | Vite 5 | Dev server, HMR, production bundling |
| State | React Context + useReducer | Global app state without external library |
| Storage | localStorage | Cross-session data persistence (single-user, no sync) |
| Styling | Plain CSS (custom properties) | Mobile-first design, no CSS framework |
| Fonts | Inter (Google Fonts) | Typography |
| PWA | Web App Manifest + Service Worker | Tier 1: installable + offline-capable |
| Hosting | Cloudflare Pages | Static hosting, automatic deploys from GitHub |
| CI | GitHub Actions | Build verification on push to `main` |
| DNS | Cloudflare | Domain + SSL (via Pages) |

---

## 3. Repository Structure

```
swim-tracker/
├── public/
│   ├── _headers              ← Cloudflare Pages HTTP security headers
│   ├── _redirects            ← SPA fallback: /* → /index.html 200
│   ├── manifest.json         ← PWA web app manifest
│   ├── sw.js                 ← Service worker (cache-first strategy)
│   └── icons/
│       ├── icon.svg          ← Source icon (swimming wave + lane design)
│       ├── icon-192.png      ← PWA icon 192×192
│       ├── icon-512.png      ← PWA icon 512×512
│       └── icon-512-maskable.png ← Android adaptive icon (safe-zone padding)
├── src/
│   ├── main.jsx              ← Entry point — mounts React, wraps StoreProvider
│   ├── App.jsx               ← Root — navigation state, screen routing, PWA components
│   ├── store.jsx             ← Global state: Context + useReducer + localStorage sync
│   ├── data/
│   │   └── defaultEvents.js  ← 20 pre-loaded standard swimming events
│   ├── utils/
│   │   └── placement.js      ← Placement calc, time formatting, ordinals
│   ├── components/
│   │   ├── BottomNav.jsx     ← Tab bar: Dashboard / Placement / Admin
│   │   ├── ConfirmDialog.jsx ← Reusable confirmation sheet (destructive actions)
│   │   ├── Dashboard.jsx     ← Stats + swimmer list with inline placements
│   │   ├── PlacementView.jsx ← Swimmer selector + expandable event placement detail
│   │   ├── OfflineIndicator.jsx ← Amber banner when navigator.onLine = false
│   │   ├── InstallPrompt.jsx ← beforeinstallprompt capture + install button
│   │   └── admin/
│   │       ├── AdminView.jsx           ← Segmented control shell
│   │       ├── EventsAdmin.jsx         ← Add/delete events
│   │       ├── CompetitorTimesAdmin.jsx ← Bulk time entry + chip management
│   │       └── SwimmersAdmin.jsx       ← Add/edit/delete swimmers + per-event times
│   └── styles/
│       └── app.css           ← All styles — CSS custom properties, mobile-first
├── .github/
│   └── workflows/
│       └── deploy.yml        ← CI only: npm ci + npm run build (no deploy step)
├── index.html                ← Vite entry, viewport meta, manifest link, SW registration
├── vite.config.js            ← React plugin only — no base path (Cloudflare serves from root)
├── package.json
├── README.md
├── ARCHITECTURE.md           ← This file
└── swimming-app-brd.md       ← Original Business Requirements Document
```

---

## 4. Architecture Diagram

```
Browser
  │
  ├─ index.html
  │    ├─ React SPA (src/main.jsx → App.jsx)
  │    │    ├─ StoreProvider (Context + useReducer)
  │    │    │    └─ localStorage "swimTracker_v1" (auto-sync on state change)
  │    │    ├─ OfflineIndicator  (navigator.onLine events)
  │    │    ├─ InstallPrompt     (beforeinstallprompt event)
  │    │    └─ Views: Dashboard | PlacementView | AdminView
  │    │
  │    └─ Service Worker (public/sw.js)
  │         ├─ Install: pre-cache /, /index.html, JS/CSS assets
  │         ├─ Fetch: cache-first → network fallback
  │         └─ Activate: purge old cache versions
  │
  └─ Cloudflare Pages
       ├─ Serves dist/ (Vite build output)
       ├─ _headers → injects security headers on all responses
       ├─ _redirects → /* → /index.html 200 (SPA routing)
       └─ Watches github.com/BugBoysWorld/swim-tracker main branch
            └─ Auto-deploys on every push (build cmd: npm run build)
```

**Data flow — placement calculation:**
```
User enters competitor times → dispatcher → reducer → state.competitorTimes[eventId][]
                                                              ↓
User enters swimmer time   → dispatcher → reducer → state.swimmerTimes[swimmerId][eventId]
                                                              ↓
                                               calculatePlacement(swimmerTime, competitorTimes)
                                                              ↓
                                               { rank, total, displayFaster[], displaySlower[] }
                                                              ↓
                                               Rendered in Dashboard + PlacementView (real-time)
```

---

## 5. Data Model

### localStorage key: `swimTracker_v1`

```js
{
  events: [
    { id: string, name: string, isDefault: boolean }
    // sorted alphabetically, 20 defaults pre-loaded
  ],

  competitorTimes: {
    [eventId]: number[]   // sorted ascending, deduplicated via Set on write
  },

  swimmers: [
    { id: string, name: string }
    // sorted alphabetically
  ],

  swimmerTimes: {
    [swimmerId]: {
      [eventId]: number   // one time per swimmer/event; new entry overwrites old
    }
  }
}
```

### ID generation
```js
uid() = Math.random().toString(36).slice(2,10) + Date.now().toString(36)
```

### State management — actions

| Action | Payload | Effect |
|---|---|---|
| `ADD_EVENT` | `name` | Appends event, sorts alpha; ignores case-insensitive duplicates |
| `DELETE_EVENT` | `eventId` | Removes event + cascades delete to all competitorTimes and swimmerTimes |
| `ADD_COMPETITOR_TIMES` | `eventId, times[]` | Merges via Set (dedup), sorts ascending |
| `DELETE_COMPETITOR_TIME` | `eventId, time` | Removes single time; placement updates immediately |
| `ADD_SWIMMER` | `name` | Appends swimmer, sorts alpha; ignores duplicates |
| `EDIT_SWIMMER` | `swimmerId, name` | Renames; rejects empty or duplicate names |
| `DELETE_SWIMMER` | `swimmerId` | Removes swimmer + all their swimmerTimes |
| `SET_SWIMMER_TIME` | `swimmerId, eventId, time` | Upserts (overwrites existing time for that event) |
| `DELETE_SWIMMER_TIME` | `swimmerId, eventId` | Removes single event time; other events unaffected |

### Placement algorithm (`src/utils/placement.js`)

Runs in O(n), called on every render where placement is displayed.

```
Input:  swimmerTime (number), competitorTimes (number[])

Steps:
1. Sort competitorTimes ascending
2. rank = (times < swimmerTime).length + 1
3. displayFaster = last 3 of times < swimmerTime  (closest above swimmer)
4. displaySlower = first 3 of times > swimmerTime (closest below swimmer)
5. showTopSeparator = true if #1 not already in displayFaster

Output: { rank, total, displayFaster[], displaySlower[], showTopSeparator, topTime }
```

**Example** — swimmerTime = 27.8, field = [24.1, 25.3, 26.0, 26.8, 27.1, 27.5, 28.2, 29.0, 29.7, 30.4]:
```
rank=7, total=10
displayFaster = [26.8, 27.1, 27.5]  → #4, #5, #6
displaySlower = [28.2, 29.0, 29.7]  → #8, #9, #10
showTopSeparator = true (gap between #1=24.1 and displayFaster start)

Rendered:
  #1  24.1s  ← gold, always shown
  ···
  #4  26.8s
  #5  27.1s
  #6  27.5s
▶ #7  27.8s  ← blue highlight, "▶ You"
  #8  28.2s
  #9  29.0s
  #10 29.7s
```

---

## 6. API Reference

Not applicable. Swim Tracker has no backend or external API calls. All data is stored in `localStorage` and all logic runs client-side.

---

## 7. Deployment

### Cloudflare Pages (production)

Cloudflare Pages watches the `main` branch of `github.com/BugBoysWorld/swim-tracker` and deploys automatically on every push.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Node.js version | 24 |
| Environment variables | None required |

**First-time setup:**
1. Cloudflare Dashboard → Workers & Pages → Create → Pages
2. Connect GitHub → select `BugBoysWorld/swim-tracker`
3. Set build command: `npm run build`, output: `dist`
4. Save — first deploy triggers automatically
5. Live at `swim-tracker.pages.dev`

### CI (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push to `main` and every PR:
- `npm ci` → `npm run build`
- Verifies the build succeeds before Cloudflare deploys
- Does NOT deploy — Cloudflare handles that independently

### Local development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # Vite build → dist/
npm run preview    # preview dist/ locally
```

---

## 8. Configuration

### `vite.config.js`
```js
export default defineConfig({
  plugins: [react()],
  // No base path — Cloudflare Pages serves from the domain root
})
```

### CSS design tokens (`src/styles/app.css`)

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#0077B6` | Buttons, nav active, rank numbers |
| `--primary-dark` | `#005F92` | Hover states |
| `--primary-light` | `#CAF0F8` | Badges, highlights |
| `--bg` | `#F0F6FA` | Page background |
| `--surface` | `#FFFFFF` | Cards |
| `--text` | `#1A202C` | Body text |
| `--text-secondary` | `#64748B` | Labels, subtitles |
| `--danger` | `#EF4444` | Delete buttons, errors |
| `--swimmer-bg` | `#EFF6FF` | Highlighted swimmer row in placement |
| `--nav-height` | `64px` | Bottom nav height |
| `--radius` | `12px` | Card border radius |

### PWA (`public/manifest.json`)

| Field | Value |
|---|---|
| `name` | Swim Tracker |
| `short_name` | SwimTrack |
| `theme_color` | `#0077B6` |
| `background_color` | `#F0F6FA` |
| `display` | standalone |
| `start_url` | `/` |
| PWA Tier | **Tier 1** — Full PWA (manifest + service worker + install prompt + offline indicator) |

### Service Worker (`public/sw.js`)

| Setting | Value |
|---|---|
| Cache key | `swim-tracker-v1` |
| Strategy | Cache-first with network fallback |
| Pre-cached assets | `/`, `/index.html` |
| Runtime caching | All GET requests (JS, CSS, fonts) |

---

## 9. Security Notes

- No API keys, secrets, or tokens anywhere in the codebase or repository
- No external API calls from the browser — app is entirely self-contained
- `localStorage` holds only non-sensitive data: event names, times, swimmer names
- `_headers` file enforces: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- No authentication required (single-user app per BRD scope)
- Service worker scope is limited to the app origin

---

## 10. Known Limitations

1. **Single-device only** — Data lives in localStorage; no sync between devices or users (out of BRD scope)
2. **No data export/import** — Competitor times must be re-entered if localStorage is cleared (out of BRD scope)
3. **No time format conversion** — Times are entered in decimal seconds only (e.g. 27.5), not MM:SS (out of BRD scope)
4. **No historical tracking** — Only the current time per swimmer/event is stored; past times are overwritten (out of BRD scope)
5. **PNG icons** — App icons are SVG-sourced; for full Samsung Internet / older Android support, regenerate as PNG using maskable.app
6. **iOS install prompt** — iOS Safari does not fire `beforeinstallprompt`; a manual "Share → Add to Home Screen" tip is shown instead
