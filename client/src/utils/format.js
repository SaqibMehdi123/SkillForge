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

/**
 * Audit fix F9: Profile called `new Date(task.completedAt || task.endedAt)
 * .toISOString()` on every render - locally-completed tasks have NEITHER
 * field, `new Date(undefined).toISOString()` throws RangeError, and the
 * Profile page white-screened. Returns a YYYY-MM-DD key or null.
 */
export function safeDateKey(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Audit fix F17: Messages formatted `new Date(msg.createdAt)` unguarded -
 * one message without createdAt crashed the whole chat pane. Returns
 * 'h:mm a' or an empty string.
 */
export function safeTimeLabel(value, formatter) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return formatter ? formatter(d) : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
