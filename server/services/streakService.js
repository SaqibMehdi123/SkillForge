/**
 * Streak day-boundary rules (audit fix B6).
 *
 * The old controller used `hoursDiff <= 30`, which wrongly CONTINUED a
 * streak when a whole calendar day was skipped (last check-in Sun 23:30,
 * next check-in Tue 01:00 = 26h elapsed, but Monday was missed).
 *
 * A streak continues only when the previous check-in was on *yesterday's*
 * or *today's* calendar date; anything older resets to 1. The logic is a
 * pure function so it can be tested deterministically.
 */

/** Local calendar date key: YYYY-M-D of the server's timezone. */
function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * @param {Object} streak - persisted state { lastCheckIn, currentStreak, longestStreak, todayCheckCount }
 * @param {Date} now - the check-in moment
 * @returns {{type: 'first'|'same-day'|'continue'|'reset', currentStreak, longestStreak, lastCheckIn, todayCheckCount}}
 */
function evaluateCheckIn(streak, now) {
  const last = streak.lastCheckIn ? new Date(streak.lastCheckIn) : null;
  const currentStreak = Math.max(0, streak.currentStreak || 0);
  const longestStreak = Math.max(0, streak.longestStreak || 0);

  if (!last || Number.isNaN(last.getTime())) {
    return {
      type: 'first',
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastCheckIn: now,
      todayCheckCount: 1,
    };
  }

  const today = dayKey(now);

  if (dayKey(last) === today) {
    // Already checked in today - only the daily counter moves.
    return {
      type: 'same-day',
      currentStreak,
      longestStreak,
      lastCheckIn: last, // keep the original check-in moment
      todayCheckCount: (streak.todayCheckCount || 0) + 1,
    };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dayKey(last) === dayKey(yesterday)) {
    const next = currentStreak + 1;
    return {
      type: 'continue',
      currentStreak: next,
      longestStreak: Math.max(longestStreak, next),
      lastCheckIn: now,
      todayCheckCount: 1,
    };
  }

  return {
    type: 'reset',
    currentStreak: 1,
    longestStreak,
    lastCheckIn: now,
    todayCheckCount: 1,
  };
}

/**
 * One-safe create-or-fetch: two concurrent first check-ins both see "no
 * doc"; the loser of the unique-index race re-reads instead of 500ing
 * (audit finding B15).
 */
async function getOrCreateStreak(userId) {
  const Streak = require('../models/Streak');
  const existing = await Streak.findOne({ user: userId });
  if (existing) return existing;
  try {
    return await Streak.create({ user: userId });
  } catch (err) {
    if (err && err.code === 11000) {
      return Streak.findOne({ user: userId });
    }
    throw err;
  }
}

module.exports = { evaluateCheckIn, getOrCreateStreak, dayKey };
