# 🏊 Swim Tracker

A mobile-first web app for competitive swim coaches to track swimmer times, compare against competitor data, and instantly determine placement rankings.

**Live:** [swimtrack.timrjlove.com](https://swimtrack.timrjlove.com)

---

## Features

- **Dashboard** — At-a-glance view of all swimmers and their placement across events
- **Placement view** — Expandable event cards showing rank (#N of M), the #1 time, and the 3 closest times above and below the swimmer
- **Admin panel** — Manage events, load competitor times in bulk, and record swimmer times
- **20 default events** — All standard Boys/Girls events pre-loaded (50/100/200/500 Free, 50/100 Back/Breast/Fly)
- **Custom events** — Add any event with a custom name
- **Offline-first** — All data stored in localStorage; works without a network connection
- **Installable** — Full PWA with home screen install support on iOS and Android

---

## Local Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

To reset all data, clear `swimTracker_v1` from localStorage (DevTools → Application → Local Storage).

---

## Deployment

Deployed via **Cloudflare Pages** — automatically on every push to `main`.

- Build command: `npm run build`
- Output directory: `dist`
- No environment variables required (app is fully client-side)

A CI workflow (`.github/workflows/deploy.yml`) runs `npm ci` + `npm run build` on every push to verify the build. Cloudflare Pages handles the actual deployment by watching the `main` branch directly.

---

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full technical documentation including the data model, component tree, placement algorithm, and PWA implementation details.

---

## BRD

The original business requirements document is at [swimming-app-brd.md](./swimming-app-brd.md).
