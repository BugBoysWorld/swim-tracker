# Architecture — Swimming Placement Tracker

## Overview

The Swimming Placement Tracker is a single-page application (SPA) built with **React 18** and bundled with **Vite 5**. It runs entirely in the browser with no backend — all state is persisted to `localStorage`. It is deployed as a static site via GitHub Actions to GitHub Pages.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| UI Framework | React 18 | Component rendering, state, effects |
| Build Tool | Vite 5 | Dev server, HMR, production bundling |
| State Management | React Context + useReducer | Global app state, action dispatch |
| Persistence | `localStorage` | Cross-session data persistence |
| Styling | Plain CSS (custom properties) | Mobile-first design, no CSS framework |
| Fonts | Inter (Google Fonts) | Typography |
| Deployment | GitHub Actions + GitHub Pages | CI/CD, static hosting |
| Version Control | Git / GitHub | Source control |

---

## Repository Structure

```
swim-tracker/
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD: build → deploy to GitHub Pages
├── src/
│   ├── main.jsx                # Entry point — mounts React, wraps StoreProvider
│   ├── App.jsx                 # Root component — navigation state, screen routing
│   ├── store.jsx               # Global state: Context, useReducer, localStorage sync
│   ├── data/
│   │   └── defaultEvents.js    # 20 pre-loaded standard swimming events
│   ├── utils/
│   │   └── placement.js        # Placement calculation, time formatting, ordinals
│   ├── components/
│   │   ├── BottomNav.jsx       # Tab bar: Dashboard / Placement / Admin
│   │   ├── ConfirmDialog.jsx   # Reusable confirmation modal (slide-up sheet)
│   │   ├── Dashboard.jsx       # Overview: stats, swimmer list with placements
│   │   ├── PlacementView.jsx   # Swimmer selector, expandable event placement detail
│   │   └── admin/
│   │       ├── AdminView.jsx           # Segmented control shell for admin tabs
│   │       ├── EventsAdmin.jsx         # Add/delete events
│   │       ├── CompetitorTimesAdmin.jsx # Bulk time entry, time chip management
│   │       └── SwimmersAdmin.jsx       # Add/edit/delete swimmers, per-event times
│   └── styles/
│       └── app.css             # All styles — CSS custom properties, mobile-first
├── index.html                  # Vite HTML entry, viewport meta, font link
├── vite.config.js              # Vite config — React plugin, GitHub Pages base path
├── package.json
├── swimming-app-brd.md         # Original Business Requirements Document
└── ARCHITECTURE.md             # This file
```

---

## State Architecture

### Data Model

All application state lives in a single store object persisted to `localStorage` under the key `swimTracker_v1`.

```js
{
  events: [
    { id: string, name: string, isDefault: boolean }
  ],

  competitorTimes: {
    [eventId]: number[]   // sorted ascending, deduplicated
  },

  swimmers: [
    { id: string, name: string }
  ],

  swimmerTimes: {
    [swimmerId]: {
      [eventId]: number   // one time per swimmer/event combination
    }
  }
}
```

### Store (`src/store.jsx`)

Uses **React Context** + **`useReducer`** to provide a Redux-like pattern without an external library.

```
StoreProvider
  └── useReducer(reducer, initialState)
       ├── state   → read via useStore()
       └── dispatch → write via action objects
```

**Persistence:** A `useEffect` watching `state` writes the full state to `localStorage` after every change. On mount, `buildInitialState()` reads from `localStorage` first, falling back to the 20 default events if no saved data exists.

**ID generation:** Each new event or swimmer gets a collision-resistant ID from `Math.random().toString(36) + Date.now().toString(36)`.

### Action Types

| Action | Payload | Effect |
|--------|---------|--------|
| `ADD_EVENT` | `name` | Adds a new event, sorted alphabetically; ignores duplicates |
| `DELETE_EVENT` | `eventId` | Removes event + all associated competitor and swimmer times |
| `ADD_COMPETITOR_TIMES` | `eventId, times[]` | Merges new times using a `Set` to deduplicate, re-sorts ascending |
| `DELETE_COMPETITOR_TIME` | `eventId, time` | Removes a single competitor time |
| `ADD_SWIMMER` | `name` | Adds swimmer, sorted alphabetically; ignores duplicates |
| `EDIT_SWIMMER` | `swimmerId, name` | Renames swimmer; rejects empty or duplicate names |
| `DELETE_SWIMMER` | `swimmerId` | Removes swimmer + all their recorded times |
| `SET_SWIMMER_TIME` | `swimmerId, eventId, time` | Upserts a swimmer's time for an event |
| `DELETE_SWIMMER_TIME` | `swimmerId, eventId` | Removes a single swimmer/event time |

---

## Component Architecture

### Navigation & Routing

There is no client-side router library. Navigation is managed in `App.jsx` via a `view` state string (`'dashboard' | 'placement' | 'admin'`). Deep-link context (e.g. which swimmer/event to pre-select in the Placement view) is passed as props when navigating.

```
App
├── view === 'dashboard'  → <Dashboard onNavigatePlacement={fn} />
├── view === 'placement'  → <PlacementView initialSwimmerId initialEventId />
├── view === 'admin'      → <AdminView />
└── <BottomNav current onChange />
```

### Component Tree

```
App
├── Dashboard
│   ├── stat cards (events / swimmers / loaded)
│   └── swimmer-card[]
│       ├── swimmer-name-row  (→ Placement w/ swimmer pre-selected)
│       └── swimmer-event-row[] (→ Placement w/ swimmer+event pre-selected)
│
├── PlacementView
│   ├── swimmer <select>
│   ├── event-expand-row[] (collapsible)
│   │   └── PlacementDetail (inline, no navigation)
│   │       ├── rank display  (#N of M)
│   │       ├── top-row       (#1 competitor, always shown)
│   │       ├── separator-row (··· ellipsis, shown when #1 not in ±3 window)
│   │       ├── time-row[]    (up to 3 faster competitors)
│   │       ├── swimmer-row   (highlighted, "▶ You" label)
│   │       └── time-row[]    (up to 3 slower competitors)
│   └── empty states
│
├── AdminView
│   ├── segmented control (Events | Comp. Times | My Swimmers)
│   ├── EventsAdmin
│   │   ├── add-event form
│   │   └── event list with delete + ConfirmDialog
│   ├── CompetitorTimesAdmin
│   │   ├── event <select>
│   │   ├── time chips (existing times, deletable)
│   │   └── bulk entry form (dynamic rows, keyboard navigation)
│   └── SwimmersAdmin
│       ├── add-swimmer form
│       └── SwimmerRow[] (per swimmer)
│           ├── inline name editing
│           ├── expandable times section
│           │   ├── existing swimmer-time rows (deletable)
│           │   └── add-time form (event select + seconds input)
│           └── ConfirmDialog (delete swimmer / delete time)
│
├── BottomNav
└── ConfirmDialog (portal-less, rendered in-tree as overlay)
```

---

## Placement Calculation (`src/utils/placement.js`)

The core algorithm runs in O(n) time and is called on every render where placement data is displayed.

```
Input:  swimmerTime (number), competitorTimes (number[])
Output: { rank, total, displayFaster[], displaySlower[], showTopSeparator, topTime }
```

**Steps:**

1. Sort competitor times ascending.
2. `rank` = count of competitor times strictly less than `swimmerTime` + 1.
3. `displayFaster` = up to the 3 competitor times immediately faster than the swimmer (closest to swimmer time, i.e. `slice(-3)` of times < swimmerTime).
4. `displaySlower` = up to the 3 competitor times immediately slower (i.e. `slice(0, 3)` of times > swimmerTime).
5. `showTopSeparator` = true if `displayFaster` does not include the #1 time (i.e. there is a gap between #1 and the start of the ±3 window).

**Example** — swimmerTime = 27.8, competitors = [24.1, 25.3, 26.0, 26.8, 27.1, 27.5, 28.2, 29.0, 29.7, 30.4]:

```
rank = 7, total = 10
displayFaster   = [26.8, 27.1, 27.5]   (#4, #5, #6)
displaySlower   = [28.2, 29.0, 29.7]   (#8, #9, #10)
showTopSeparator = true  (because #1 = 24.1 is not in displayFaster)
topTime          = 24.1

Rendered:
  #1   24.1s  ← always shown, gold highlight
  ···          ← separator (gap exists)
  #4   26.8s
  #5   27.1s
  #6   27.5s
▶ #7   27.8s  ← swimmer row, blue highlight
  #8   28.2s
  #9   29.0s
  #10  29.7s
```

---

## Styling System

All styles are in a single `app.css` file using **CSS custom properties** for theming. No CSS framework or CSS-in-JS is used.

### Design Tokens

```css
--primary:        #0077B6   /* main blue */
--primary-dark:   #005F92
--primary-light:  #CAF0F8
--accent:         #00B4D8
--bg:             #F0F6FA   /* page background */
--surface:        #FFFFFF   /* card background */
--text:           #1A202C
--text-secondary: #64748B
--border:         #E2E8F0
--danger:         #EF4444
--swimmer-bg:     #EFF6FF   /* highlighted swimmer row */
--swimmer-text:   #1D4ED8
--nav-height:     64px
--radius:         12px
```

### Mobile-First Layout

- `max-width: 480px` centered app shell — designed for phone screens, readable on desktop.
- `env(safe-area-inset-*)` used on header and bottom nav for notch/home-indicator devices.
- Touch targets are minimum 44px tall throughout.
- `-webkit-overflow-scrolling: touch` on scrollable content areas.

---

## CI/CD Pipeline

```
git push → main
    │
    └── GitHub Actions: deploy.yml
            ├── actions/checkout@v4
            ├── actions/setup-node@v4  (Node 24)
            ├── npm ci
            ├── npm run build          (Vite → dist/)
            ├── actions/configure-pages@v4  (enablement: true)
            ├── actions/upload-pages-artifact@v3
            └── actions/deploy-pages@v4
                    └── https://bugboysworld.github.io/swim-tracker/
```

The workflow runs on every push to `main` and can also be triggered manually via `workflow_dispatch`.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| No router library | Three screens with simple linear navigation; a full router would add complexity with no benefit |
| No external state library | `useReducer` + Context covers the data volume; Redux/Zustand would be over-engineered |
| Single CSS file | Keeps styles co-located and easy to audit; scoping is handled by class naming conventions |
| `localStorage` only | BRD explicitly states no cloud/sync requirements; localStorage is synchronous and reliable for this data volume |
| Flat data structure | Event IDs as foreign keys into flat maps allows O(1) lookups for placement calc without joins |
| Deduplication via `Set` | Competitor times are stored as a JS `Set` during merge then converted to a sorted array — prevents duplicates at write time |
| Vite base path | GitHub Pages serves from `/swim-tracker/`, so `base: '/swim-tracker/'` is set in `vite.config.js` for correct asset resolution in production |

---

## Local Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview production build locally
```

Data is stored in `localStorage` under the key `swimTracker_v1`. Clear it in DevTools → Application → Local Storage to reset to default state.
