import { createContext, useContext, useReducer, useEffect } from 'react';
import { DEFAULT_EVENT_NAMES } from './data/defaultEvents';

const StoreContext = createContext(null);

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/**
 * Migrate swimTracker_v1 state (competitorTimes as number[]) to v2 shape
 * (competitorTimes as { time, name, school }[]).
 */
function migrateState(raw) {
  if (!raw) return null;
  try {
    const competitorTimes = {};
    for (const [eventId, entries] of Object.entries(raw.competitorTimes || {})) {
      if (Array.isArray(entries)) {
        competitorTimes[eventId] = entries.map((e) =>
          typeof e === 'number' ? { time: e, name: '', school: '' } : e
        );
      }
    }
    return { ...raw, competitorTimes };
  } catch {
    return raw;
  }
}

function loadState() {
  try {
    // Check for v2 first
    const v2 = localStorage.getItem('swimTracker_v2');
    if (v2) return JSON.parse(v2);

    // Migrate from v1 if present
    const v1 = localStorage.getItem('swimTracker_v1');
    if (v1) {
      const migrated = migrateState(JSON.parse(v1));
      // Persist migrated state immediately and remove old key
      localStorage.setItem('swimTracker_v2', JSON.stringify(migrated));
      localStorage.removeItem('swimTracker_v1');
      return migrated;
    }
  } catch {}
  return null;
}

function buildInitialState() {
  const saved = loadState();
  if (saved) return saved;
  return {
    events: DEFAULT_EVENT_NAMES.map((name) => ({ id: uid(), name, isDefault: true })),
    competitorTimes: {},  // { [eventId]: { time, name, school }[] }
    swimmers: [],         // { id, name }[]
    swimmerTimes: {},     // { [swimmerId]: { [eventId]: number } }
  };
}

function reducer(state, action) {
  switch (action.type) {
    // ── Events ──────────────────────────────────────────────────────
    case 'ADD_EVENT': {
      const name = action.name.trim();
      if (!name) return state;
      if (state.events.some((e) => e.name.toLowerCase() === name.toLowerCase())) return state;
      const newEvent = { id: uid(), name, isDefault: false };
      const events = [...state.events, newEvent].sort((a, b) => a.name.localeCompare(b.name));
      return { ...state, events };
    }
    case 'DELETE_EVENT': {
      const { eventId } = action;
      const competitorTimes = { ...state.competitorTimes };
      delete competitorTimes[eventId];
      const swimmerTimes = {};
      for (const [sid, times] of Object.entries(state.swimmerTimes)) {
        const t = { ...times };
        delete t[eventId];
        swimmerTimes[sid] = t;
      }
      return { ...state, events: state.events.filter((e) => e.id !== eventId), competitorTimes, swimmerTimes };
    }

    // ── Competitor Times ─────────────────────────────────────────────
    case 'ADD_COMPETITOR_TIMES': {
      const { eventId, times } = action;
      // times: { time, name, school }[]
      const existing = state.competitorTimes[eventId] || [];
      const existingByTime = new Map(existing.map((e) => [e.time, e]));
      for (const entry of times) {
        const t = typeof entry === 'number' ? { time: entry, name: '', school: '' } : entry;
        const n = parseFloat(t.time);
        if (n > 0) {
          // Prefer the new entry (it may have a name/school) over the old one
          existingByTime.set(n, { time: n, name: (t.name || '').trim(), school: (t.school || '').trim() });
        }
      }
      const updated = Array.from(existingByTime.values()).sort((a, b) => a.time - b.time);
      return { ...state, competitorTimes: { ...state.competitorTimes, [eventId]: updated } };
    }
    case 'DELETE_COMPETITOR_TIME': {
      const { eventId, time } = action;
      const updated = (state.competitorTimes[eventId] || []).filter((e) => e.time !== time);
      return { ...state, competitorTimes: { ...state.competitorTimes, [eventId]: updated } };
    }

    // ── Swimmers ─────────────────────────────────────────────────────
    case 'ADD_SWIMMER': {
      const name = action.name.trim();
      if (!name) return state;
      if (state.swimmers.some((s) => s.name.toLowerCase() === name.toLowerCase())) return state;
      const swimmers = [...state.swimmers, { id: uid(), name }].sort((a, b) => a.name.localeCompare(b.name));
      return { ...state, swimmers };
    }
    case 'EDIT_SWIMMER': {
      const name = action.name.trim();
      if (!name) return state;
      const others = state.swimmers.filter((s) => s.id !== action.swimmerId);
      if (others.some((s) => s.name.toLowerCase() === name.toLowerCase())) return state;
      const swimmers = state.swimmers
        .map((s) => (s.id === action.swimmerId ? { ...s, name } : s))
        .sort((a, b) => a.name.localeCompare(b.name));
      return { ...state, swimmers };
    }
    case 'DELETE_SWIMMER': {
      const swimmerTimes = { ...state.swimmerTimes };
      delete swimmerTimes[action.swimmerId];
      return { ...state, swimmers: state.swimmers.filter((s) => s.id !== action.swimmerId), swimmerTimes };
    }
    case 'SET_SWIMMER_TIME': {
      const { swimmerId, eventId, time } = action;
      const n = parseFloat(time);
      if (!(n > 0)) return state;
      const prev = state.swimmerTimes[swimmerId] || {};
      return { ...state, swimmerTimes: { ...state.swimmerTimes, [swimmerId]: { ...prev, [eventId]: n } } };
    }
    case 'DELETE_SWIMMER_TIME': {
      const { swimmerId, eventId } = action;
      const prev = { ...(state.swimmerTimes[swimmerId] || {}) };
      delete prev[eventId];
      return { ...state, swimmerTimes: { ...state.swimmerTimes, [swimmerId]: prev } };
    }

    // ── Batch actions (CSV import) ───────────────────────────────────
    case 'BATCH_ADD_SWIMMERS': {
      // action.names: string[]
      let swimmers = [...state.swimmers];
      for (const rawName of action.names) {
        const name = rawName.trim();
        if (!name) continue;
        if (swimmers.some((s) => s.name.toLowerCase() === name.toLowerCase())) continue;
        swimmers.push({ id: uid(), name });
      }
      swimmers.sort((a, b) => a.name.localeCompare(b.name));
      return { ...state, swimmers };
    }
    case 'BATCH_SET_SWIMMER_TIMES': {
      // action.entries: [{ swimmerId, eventId, time }]
      let swimmerTimes = { ...state.swimmerTimes };
      for (const { swimmerId, eventId, time } of action.entries) {
        const n = parseFloat(time);
        if (!(n > 0)) continue;
        const prev = swimmerTimes[swimmerId] || {};
        swimmerTimes[swimmerId] = { ...prev, [eventId]: n };
      }
      return { ...state, swimmerTimes };
    }

    // ── Backup import ────────────────────────────────────────────────
    case 'IMPORT_BACKUP': {
      // action.state: full validated state object
      return action.state;
    }

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, buildInitialState);

  useEffect(() => {
    try {
      localStorage.setItem('swimTracker_v2', JSON.stringify(state));
    } catch {}
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
