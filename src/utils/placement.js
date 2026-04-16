/**
 * Calculate placement data for a swimmer's time against competitor times.
 *
 * @param {number} swimmerTime
 * @param {number[]} competitorTimes - already sorted ascending
 * @returns {{ rank: number, total: number, displayFaster: number[], displaySlower: number[], showTopSeparator: boolean } | null}
 */
export function calculatePlacement(swimmerTime, competitorTimes) {
  if (!competitorTimes || competitorTimes.length === 0) return null;

  const sorted = [...competitorTimes].sort((a, b) => a - b);
  const fasterTimes = sorted.filter((t) => t < swimmerTime);
  const slowerTimes = sorted.filter((t) => t > swimmerTime);

  const rank = fasterTimes.length + 1;
  const total = sorted.length;

  // Up to 3 closest times faster than swimmer
  const displayFaster = fasterTimes.slice(-3);
  // Up to 3 closest times slower than swimmer
  const displaySlower = slowerTimes.slice(0, 3);

  // Rank of the first displayed faster time
  const firstDisplayedFasterRank = fasterTimes.length - displayFaster.length + 1;
  // Show "#1 separator" if #1 is not already in displayFaster
  const showTopSeparator = displayFaster.length > 0 && firstDisplayedFasterRank > 1;
  const topTime = sorted[0];

  return { rank, total, displayFaster, displaySlower, showTopSeparator, topTime, sorted };
}

export function formatTime(time) {
  return parseFloat(time).toFixed(1);
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Build a Map from time value → { name, school } for UI annotation.
 * Used by PlacementView to display competitor names alongside times.
 *
 * @param {Array<{ time: number, name: string, school: string }>} entries
 * @returns {Map<number, { name: string, school: string }>}
 */
export function buildTimeIndex(entries) {
  const map = new Map();
  if (!entries) return map;
  for (const entry of entries) {
    if (entry && typeof entry.time === 'number') {
      map.set(entry.time, { name: entry.name || '', school: entry.school || '' });
    }
  }
  return map;
}
