/**
 * Pure validation functions for CSV and JSON backup imports.
 * No side effects — all functions return { valid[], errors[] } or { ok, errors[] }.
 */

/**
 * Validate rows from competitor times CSV.
 * Expected columns: Event, Time, Name (optional), School (optional)
 *
 * @param {object[]} rows - PapaParse rows (objects with header keys)
 * @param {Array<{ id: string, name: string }>} events
 * @returns {{ valid: Array<{ eventId, time, name, school }>, errors: string[] }}
 */
export function validateCompetitorTimesCSV(rows, events) {
  const valid = [];
  const errors = [];

  rows.forEach((row, i) => {
    const lineNum = i + 2; // 1-indexed + header
    const eventName = (row['Event'] || '').trim();
    const timeStr = (row['Time'] || '').trim();
    const name = (row['Name'] || '').trim();
    const school = (row['School'] || '').trim();

    if (!eventName && !timeStr) return; // skip truly blank rows

    if (!eventName) {
      errors.push(`Row ${lineNum}: Missing event name.`);
      return;
    }

    const matchedEvent = events.find(
      (e) => e.name.toLowerCase() === eventName.toLowerCase()
    );
    if (!matchedEvent) {
      errors.push(`Row ${lineNum}: Event "${eventName}" not found. Add it in Admin → Events first.`);
      return;
    }

    const time = parseFloat(timeStr);
    if (!timeStr || isNaN(time) || time <= 0) {
      errors.push(`Row ${lineNum}: Invalid time "${timeStr}". Must be a positive number (e.g. 27.5).`);
      return;
    }

    valid.push({ eventId: matchedEvent.id, time, name, school });
  });

  return { valid, errors };
}

/**
 * Validate rows from swimmers CSV.
 * Expected columns: Name
 *
 * @param {object[]} rows
 * @returns {{ valid: string[], errors: string[] }}
 */
export function validateSwimmersCSV(rows) {
  const valid = [];
  const errors = [];
  const seen = new Set();

  rows.forEach((row, i) => {
    const lineNum = i + 2;
    const name = (row['Name'] || '').trim();

    if (!name) {
      errors.push(`Row ${lineNum}: Missing swimmer name.`);
      return;
    }

    if (seen.has(name.toLowerCase())) {
      errors.push(`Row ${lineNum}: Duplicate name "${name}" in file — skipped.`);
      return;
    }

    seen.add(name.toLowerCase());
    valid.push(name);
  });

  return { valid, errors };
}

/**
 * Validate rows from swimmer times CSV.
 * Expected columns: SwimmerName, EventName, Time
 *
 * @param {object[]} rows
 * @param {Array<{ id: string, name: string }>} swimmers
 * @param {Array<{ id: string, name: string }>} events
 * @returns {{ valid: Array<{ swimmerId, eventId, time }>, errors: string[] }}
 */
export function validateSwimmerTimesCSV(rows, swimmers, events) {
  const valid = [];
  const errors = [];

  rows.forEach((row, i) => {
    const lineNum = i + 2;
    const swimmerName = (row['SwimmerName'] || '').trim();
    const eventName = (row['EventName'] || '').trim();
    const timeStr = (row['Time'] || '').trim();

    if (!swimmerName && !eventName && !timeStr) return;

    if (!swimmerName) {
      errors.push(`Row ${lineNum}: Missing swimmer name.`);
      return;
    }

    if (!eventName) {
      errors.push(`Row ${lineNum}: Missing event name.`);
      return;
    }

    const swimmer = swimmers.find(
      (s) => s.name.toLowerCase() === swimmerName.toLowerCase()
    );
    if (!swimmer) {
      errors.push(`Row ${lineNum}: Swimmer "${swimmerName}" not found. Add them in Admin → My Swimmers first.`);
      return;
    }

    const event = events.find(
      (e) => e.name.toLowerCase() === eventName.toLowerCase()
    );
    if (!event) {
      errors.push(`Row ${lineNum}: Event "${eventName}" not found. Add it in Admin → Events first.`);
      return;
    }

    const time = parseFloat(timeStr);
    if (!timeStr || isNaN(time) || time <= 0) {
      errors.push(`Row ${lineNum}: Invalid time "${timeStr}". Must be a positive number (e.g. 27.5).`);
      return;
    }

    valid.push({ swimmerId: swimmer.id, eventId: event.id, time });
  });

  return { valid, errors };
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

  if (!Array.isArray(parsed.events)) {
    errors.push('Missing or invalid "events" array.');
  }
  if (typeof parsed.competitorTimes !== 'object' || Array.isArray(parsed.competitorTimes)) {
    errors.push('Missing or invalid "competitorTimes" object.');
  }
  if (!Array.isArray(parsed.swimmers)) {
    errors.push('Missing or invalid "swimmers" array.');
  }
  if (typeof parsed.swimmerTimes !== 'object' || Array.isArray(parsed.swimmerTimes)) {
    errors.push('Missing or invalid "swimmerTimes" object.');
  }

  return { ok: errors.length === 0, errors };
}
