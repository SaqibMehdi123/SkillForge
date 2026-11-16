const MAX_SESSION_MINUTES = 1440; // one full day of practice
const MAX_LEVEL = 9999; // level ceiling keeps the math inside Number precision

/**
 * Audit fix B5: the old `while (user.xp >= user.level * 100)` loop blocked
 * the event loop for >10s when a request carried xp: 1e15 (and hung forever
 * for MAX_SAFE_INTEGER) - a trivial DoS by any logged-in account.
 *
 * The level rule is unchanged: advancing from level L to L+1 costs L * 100
 * XP, so the cumulative XP needed to reach level L is
 *   T(L) = 100 * (1 + 2 + ... + (L-1)) = 50 * L * (L - 1)
 * which can be inverted in O(1):
 *   L = floor((1 + sqrt(1 + xp / 12.5)) / 2)
 *
 * Apply XP to a user with the shared level-up rule (each level-up grants
 * 10 coins). Used by every code path that awards XP so the rules stay
 * consistent.
 */
function levelForXp(total) {
  return Math.floor((1 + Math.sqrt(1 + total / 12.5)) / 2);
}

function xpForLevel(level) {
  return 50 * level * (level - 1); // cumulative XP consumed by reaching `level`
}

function applyXp(user, amount) {
  const value = Math.max(0, Math.round(Number(amount) || 0));
  const previousLevel = Math.max(1, user.level || 1);

  // user.xp stores the leftover inside the current level, so the true
  // cumulative total = leftover + everything already consumed to reach
  // previousLevel. Computing the level from the leftover alone (instead of
  // the total) silently DOWNGRADED users - caught by the practice suite.
  const total = Math.max(0, user.xp || 0) + xpForLevel(previousLevel) + value;

  let level = levelForXp(total);
  if (level > MAX_LEVEL) {
    level = MAX_LEVEL;
    user.xp = Math.min(total - xpForLevel(level), level * 100 - 1);
  } else {
    user.xp = total - xpForLevel(level);
  }

  user.level = level;
  user.coins = (user.coins || 0) + Math.max(0, level - previousLevel) * 10;
  return user;
}

/**
 * Audit fix B5 (endpoint half): client-facing XP sources are capped per
 * request. Legit single awards are <= ~300 XP (a clamped 24h session) or
 * 100 XP (first_steps), so 500 is a generous ceiling that still rules out
 * runaway values.
 */
const MAX_XP_PER_REQUEST = 500;

/**
 * Server-side reward formula (audit fix C9):
 * the client may no longer dictate XP - rewards are derived from the
 * validated practice duration only: 1 XP per 5 minutes, 1 coin per 10 minutes.
 */
function rewardsForDuration(minutes) {
  const m = clampDuration(minutes);
  return {
    xpEarned: Math.max(1, Math.round(m / 5)),
    coinsEarned: Math.max(0, Math.round(m / 10)),
  };
}

/**
 * Durations arrive from several client versions in different units.
 * Policy: minutes; non-numeric/non-positive input is rejected by the caller,
 * anything positive is clamped to MAX_SESSION_MINUTES so a spoofed
 * "100000 minutes" request can never mint an unbounded reward.
 */
function clampDuration(minutes) {
  return Math.min(Math.max(1, Math.round(Number(minutes))), MAX_SESSION_MINUTES);
}

function isValidDuration(minutes) {
  return typeof minutes === 'number' && Number.isFinite(minutes) && minutes > 0;
}

module.exports = {
  applyXp,
  rewardsForDuration,
  clampDuration,
  isValidDuration,
  MAX_SESSION_MINUTES,
  MAX_XP_PER_REQUEST,
  levelForXp,
  xpForLevel,
};
