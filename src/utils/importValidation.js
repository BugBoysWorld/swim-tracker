/**
 * Pure validation functions for CSV and JSON backup imports.
 * No side effects — all functions return { valid[], errors[], warnings[] } or { ok, errors[] }.
 *
 * Event name matching uses a two-tier fuzzy strategy:
 *
 *  Tier 1 — Structured component match:
 *    Parse each name into 3 canonical components:
 *      • distance  – a number (50, 100, 200, 500 …)
 *      • stroke    – free | back | breast | fly | im
 *      • gender    – boys | girls
 *    If the parsed input shares ≥ 2 components with a candidate, it matches.
 *    This handles word-order variation AND all common abbreviations/plurals:
 *      "Boys 50 Free" = "50 Free Boys" = "50 Freestyle Boy" = "Boys Freestyle 50"
 *
 *  Tier 2 — Token Jaccard fallback:
 *    Used for custom events that don't have standard stroke/distance/gender
 *    tokens. Requires ≥ 50 % Jaccard overlap after abbreviation normalisation.
 *
 *  Fuzzy matches are accepted and reported in the `warnings` array.
 */

// ── Component parsing ────────────────────────────────────────────────────────

const STROKE_CANON = {
  free: 'free', freestyle: 'free',
  back: 'back', backstroke: 'back',
  breast: 'breast', breaststroke: 'breast',
  fly: 'fly',   butterfly: 'fly',
  im: 'im', medley: 'im',
};

// Multi-word strokes — checked before tokenising
const MULTI_WORD_STROKES = [
  [/individual\s+medley/gi, 'im'],
];

const GENDER_CANON = {
  boy: 'boys', boys: 'boys',
  girl: 'girls', girls: 'girls',
  men: 'boys',   man: 'boys',
  women: 'girls', woman: 'girls',
  male: 'boys',  female: 'girls',
};

/**
 * Parse an event name string into its canonical components.
 * @returns {{ distance: number|null, stroke: string|null, gender: string|null }}
 */
function parseEventComponents(name) {
  let s = name.toLowerCase();

  // Replace multi-word stroke phrases first
  for (const [pattern, replacement] of MULTI_WORD_STROKES) {
    s = s.replace(pattern, replacement);
  }

  let distance = null;
  let stroke   = null;
  let gender   = null;

  for (const token of s.split(/[\s\-_/]+/).filter(Boolean)) {
    if (!distance && /^\d+$/.test(token)) {
      distance = parseInt(token, 10);
    } else if (!stroke && STROKE_CANON[token]) {
      stroke = STROKE_CANON[token];
    } else if (!gender && GENDER_CANON[token]) {
      gender = GENDER_CANON[token];
    }
  }

  return { distance, stroke, gender };
}

/**
 * Count how many non-null components two parsed event objects share.
 */
function sharedComponents(a, b) {
  let shared = 0;
  if (a.distance !== null && b.distance !== null && a.distance === b.distance) shared++;
  if (a.stroke   !== null && b.stroke   !== null && a.stroke   === b.stroke)   shared++;
  if (a.gender   !== null && b.gender   !== null && a.gender   === b.gender)   shared++;
  return shared;
}

// ── Jaccard fallback ─────────────────────────────────────────────────────────

const ABBREV_MAP = [
  [/\bfreestyle\b/g, 'free'],
  [/\bbackstroke\b/g, 'back'],
  [/\bbreaststroke\b/g, 'breast'],
  [/\bbutterfly\b/g, 'fly'],
  [/\bindividual\s+medley\b/g, 'im'],
  [/\bmedley\b/g, 'im'],
  [/\bboy\b/g,  'boys'],
  [/\bgirl\b/g, 'girls'],
];

function normalizeForJaccard(name) {
  let s = name.toLowerCase();
  for (const [pattern, replacement] of ABBREV_MAP) {
    s = s.replace(pattern, replacement);
  }
  return s
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .sort()
    .join(' ');
}

// ── Unified event matcher ─────────────────────────────────────────────────────

/**
 * Find the best matching event for a raw input string.
 *
 * @param {string} input
 * @param {Array<{ id: string, name: string }>} events
 * @returns {{ event: object, exact: boolean } | null}
 */
function findBestEventMatch(input, events) {
  // 1. Exact case-insensitive
  const exact = events.find((e) => e.name.toLowerCase() === input.toLowerCase());
  if (exact) return { event: exact, exact: true };

  // 2. Structured component match
  const inputParts = parseEventComponents(input);
  const inputNonNull = [inputParts.distance, inputParts.stroke, inputParts.gender].filter(Boolean).length;

  if (inputNonNull >= 1) {
    // Score each event: number of shared components
    let bestEvent = null;
    let bestShared = 0;

    for (const event of events) {
      const eventParts = parseEventComponents(event.name);
      const shared = sharedComponents(inputParts, eventParts);
      if (shared > bestShared) {
        bestShared = shared;
        bestEvent  = event;
      }
    }

    // Require ≥ 2 shared components OR all non-null input components matched
    if (bestEvent && (bestShared >= 2 || (inputNonNull > 0 && bestShared === inputNonNull))) {
      return { event: bestEvent, exact: false };
    }
  }

  // 3. Jaccard token fallback (for custom event names)
  const normInput = normalizeForJaccard(input);
  const inputSet  = new Set(normInput.split(' ').filter(Boolean));
  if (inputSet.size === 0) return null;

  let bestEvent = null;
  let bestScore = 0;

  for (const event of events) {
    const normEvent = normalizeForJaccard(event.name);
    const eventSet  = new Set(normEvent.split(' ').filter(Boolean));
    const intersection = [...inputSet].filter((t) => eventSet.has(t)).length;
    const union        = new Set([...inputSet, ...eventSet]).size;
    const score        = union > 0 ? intersection / union : 0;
    if (score > bestScore) { bestScore = score; bestEvent = event; }
  }

  if (bestScore >= 0.5 && bestEvent) return { event: bestEvent, exact: false };

  return null;
}

// ── Validators ────────────────────────────────────────────────────────────────

/**
 * Validate rows from competitor times CSV.
 * Columns: Event, Time, Name (optional), School (optional)
 *
 * @param {object[]} rows
 * @param {Array<{ id: string, name: string }>} events
 * @returns {{ valid: Array<{ eventId, time, name, school }>, errors: string[], warnings: string[] }}
 */
export function validateCompetitorTimesCSV(rows, events) {
  const valid    = [];
  const errors   = [];
  const warnings = [];

  rows.forEach((row, i) => {
    const lineNum = i + 2;
    const eventName = (row['Event']  || '').trim();
    const timeStr   = (row['Time']   || '').trim();
    const name      = (row['Name']   || '').trim();
    const school    = (row['School'] || '').trim();

    if (!eventName && !timeStr) return;

    if (!eventName) {
      errors.push(`Row ${lineNum}: Missing event name.`);
      return;
    }

    const match = findBestEventMatch(eventName, events);
    if (!match) {
      errors.push(`Row ${lineNum}: Event "${eventName}" not found and no close match exists. Add it in Admin → Events first.`);
      return;
    }
    if (!match.exact) {
      warnings.push(`Row ${lineNum}: "${eventName}" → matched to "${match.event.name}"`);
    }

    const time = parseFloat(timeStr);
    if (!timeStr || isNaN(time) || time <= 0) {
      errors.push(`Row ${lineNum}: Invalid time "${timeStr}". Must be a positive number (e.g. 27.5).`);
      return;
    }

    valid.push({ eventId: match.event.id, time, name, school });
  });

  return { valid, errors, warnings };
}

/**
 * Validate rows from swimmers CSV.
 * Columns: Name
 *
 * @param {object[]} rows
 * @returns {{ valid: string[], errors: string[], warnings: string[] }}
 */
export function validateSwimmersCSV(rows) {
  const valid    = [];
  const errors   = [];
  const warnings = [];
  const seen     = new Set();

  rows.forEach((row, i) => {
    const lineNum = i + 2;
    const name    = (row['Name'] || '').trim();

    if (!name) {
      errors.push(`Row ${lineNum}: Missing swimmer name.`);
      return;
    }

    if (seen.has(name.toLowerCase())) {
      warnings.push(`Row ${lineNum}: Duplicate name "${name}" — skipped.`);
      return;
    }

    seen.add(name.toLowerCase());
    valid.push(name);
  });

  return { valid, errors, warnings };
}

/**
 * Validate rows from swimmer times CSV.
 * Columns: SwimmerName, EventName, Time
 *
 * @param {object[]} rows
 * @param {Array<{ id: string, name: string }>} swimmers
 * @param {Array<{ id: string, name: string }>} events
 * @returns {{ valid: Array<{ swimmerId, eventId, time }>, errors: string[], warnings: string[] }}
 */
export function validateSwimmerTimesCSV(rows, swimmers, events) {
  const valid    = [];
  const errors   = [];
  const warnings = [];

  rows.forEach((row, i) => {
    const lineNum     = i + 2;
    const swimmerName = (row['SwimmerName'] || '').trim();
    const eventName   = (row['EventName']   || '').trim();
    const timeStr     = (row['Time']        || '').trim();

    if (!swimmerName && !eventName && !timeStr) return;

    if (!swimmerName) { errors.push(`Row ${lineNum}: Missing swimmer name.`); return; }
    if (!eventName)   { errors.push(`Row ${lineNum}: Missing event name.`);   return; }

    // Swimmer: exact case-insensitive (names are arbitrary, no fuzzy)
    const swimmer = swimmers.find((s) => s.name.toLowerCase() === swimmerName.toLowerCase());
    if (!swimmer) {
      errors.push(`Row ${lineNum}: Swimmer "${swimmerName}" not found. Add them in Admin → My Swimmers first.`);
      return;
    }

    // Event: fuzzy match
    const match = findBestEventMatch(eventName, events);
    if (!match) {
      errors.push(`Row ${lineNum}: Event "${eventName}" not found and no close match exists. Add it in Admin → Events first.`);
      return;
    }
    if (!match.exact) {
      warnings.push(`Row ${lineNum}: "${eventName}" → matched to "${match.event.name}"`);
    }

    const time = parseFloat(timeStr);
    if (!timeStr || isNaN(time) || time <= 0) {
      errors.push(`Row ${lineNum}: Invalid time "${timeStr}". Must be a positive number (e.g. 27.5).`);
      return;
    }

    valid.push({ swimmerId: swimmer.id, eventId: match.event.id, time });
  });

  return { valid, errors, warnings };
}

/**
 * Validate a parsed JSON backup object.
 *
 * @param {unknown} parsed
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateBackupJSON(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, errors: ['Invalid backup: not a JSON object.'] };
  }
  if (!Array.isArray(parsed.events))
    errors.push('Missing or invalid "events" array.');
  if (typeof parsed.competitorTimes !== 'object' || Array.isArray(parsed.competitorTimes))
    errors.push('Missing or invalid "competitorTimes" object.');
  if (!Array.isArray(parsed.swimmers))
    errors.push('Missing or invalid "swimmers" array.');
  if (typeof parsed.swimmerTimes !== 'object' || Array.isArray(parsed.swimmerTimes))
    errors.push('Missing or invalid "swimmerTimes" object.');

  return { ok: errors.length === 0, errors };
}
