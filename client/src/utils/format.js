/**
 * Shared formatting helpers (audit fixes F3/F4/F35).
 *
 * The codebase drifted into THREE copies of duration/date formatting with
 * inconsistent units (minutes vs seconds) - a 30-minute task rendered as
 * "0 minutes" in four components. The store now holds MINUTES everywhere
 * (see practiceSlice getHistory normalization); these helpers format them.
 */

/** Format a MINUTES value for display, escalating to hours when large. */
export function formatMinutes(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }
  return `${m} min`;
}

/** Sum an array of task durations (minutes), tolerating missing values. */
export function sumMinutes(tasks = []) {
  return (tasks || []).reduce((total, t) => total + (Number(t?.duration) || 0), 0);
}

/** Safe ISO date conversion - returns null instead of throwing on invalid input. */
export function safeIsoDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
