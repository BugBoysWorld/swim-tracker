import { createContext, useContext, useReducer, useEffect } from 'react';
import { DEFAULT_EVENT_NAMES } from './data/defaultEvents';

const StoreContext = createContext(null);

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadState() {
  try {
    const raw = localStorage.getItem('swimTracker_v1');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function buildInitialState() {
  const saved = loadState();
  if (saved) return saved;
  return {
    events: DEFAULT_EVENT_NAMES.map((name) => ({ id: uid(), name, isDefault: true })),
    competitorTimes: {},  // { [eventId]: number[] }
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
      const existing = new Set(state.competitorTimes[eventId] || []);
      for (const t of times) {
        const n = parseFloat(t);
        if (n > 0) existing.add(n);
      }
      const updated = Array.from(existing).sort((a, b) => a - b);
      return { ...state, competitorTimes: { ...state.competitorTimes, [eventId]: updated } };
    }
    case 'DELETE_COMPETITOR_TIME': {
      const { eventId, time } = action;
      const updated = (state.competitorTimes[eventId] || []).filter((t) => t !== time);
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

    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, buildInitialState);

  useEffect(() => {
    try {
      localStorage.setItem('swimTracker_v1', JSON.stringify(state));
    } catch {}
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
