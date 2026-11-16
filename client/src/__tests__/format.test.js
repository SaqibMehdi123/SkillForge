/**
 * F9 + F17: date/time helpers must never throw.
 *   - Profile called `new Date(task.completedAt || task.endedAt).toISOString()`
 *     on tasks that have NEITHER field -> RangeError -> white screen.
 *   - Messages formatted `new Date(msg.createdAt)` unguarded -> one message
 *     without createdAt crashed the whole chat pane.
 */
import { safeDateKey, safeTimeLabel, safeIsoDate, formatMinutes, sumMinutes } from '../utils/format';

describe('safeDateKey (F9)', () => {
  test('formats a valid timestamp as YYYY-MM-DD', () => {
    expect(safeDateKey('2026-03-15T10:30:00.000Z')).toBe('2026-03-15');
  });

  test('undefined / null / empty string return null without throwing', () => {
    expect(() => safeDateKey(undefined)).not.toThrow();
    expect(safeDateKey(undefined)).toBeNull();
    expect(safeDateKey(null)).toBeNull();
    expect(safeDateKey('')).toBeNull();
  });

  test('garbage strings return null instead of a RangeError', () => {
    expect(safeDateKey('not-a-date')).toBeNull();
  });

  test('the exact Profile crash input (locally completed task) survives', () => {
    const localTask = { id: 1, name: 'Guitar', duration: 30 }; // no dates at all
    const key = safeDateKey(localTask.completedAt || localTask.endedAt || localTask.updatedAt || localTask.createdAt);
    expect(key).toBeNull(); // old code: new Date(undefined).toISOString() threw
  });
});

describe('safeTimeLabel (F17)', () => {
  test('formats a valid timestamp through the provided formatter', () => {
    const label = safeTimeLabel('2026-03-15T10:30:00.000Z', (d) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} PM`);
    expect(label).toMatch(/PM$/);
  });

  test('missing createdAt returns an empty string instead of crashing', () => {
    expect(() => safeTimeLabel(undefined, () => 'x')).not.toThrow();
    expect(safeTimeLabel(undefined)).toBe('');
    expect(safeTimeLabel(null)).toBe('');
    expect(safeTimeLabel('garbage')).toBe('');
  });
});

describe('safeIsoDate', () => {
  test('invalid input returns null, valid input returns ISO', () => {
    expect(safeIsoDate('nope')).toBeNull();
    expect(safeIsoDate('2026-01-01T00:00:00.000Z')).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('formatMinutes / sumMinutes (F3/F4 display helpers)', () => {
  test('minutes escalate to hours', () => {
    expect(formatMinutes(30)).toBe('30 min');
    expect(formatMinutes(60)).toBe('1h');
    expect(formatMinutes(90)).toBe('1h 30m');
    expect(formatMinutes(undefined)).toBe('0 min');
  });

  test('sumMinutes tolerates missing durations', () => {
    expect(sumMinutes([{ duration: 30 }, { duration: 15 }, {}])).toBe(45);
    expect(sumMinutes(undefined)).toBe(0);
  });
});
