const MAX_SESSION_MINUTES = 1440; // one full day of practice

/**
 * Apply XP to a user with the shared level-up rule
 * (level N requires N * 100 XP; each level-up grants 10 coins).
 * Used by every code path that awards XP so the rules stay consistent.
 */
function applyXp(user, amount) {
  const value = Math.max(0, Math.round(Number(amount) || 0));
  user.xp = (user.xp || 0) + value;
  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100;
    user.level += 1;
    user.coins += 10;
  }
  return user;
}

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

module.exports = { applyXp, rewardsForDuration, clampDuration, isValidDuration, MAX_SESSION_MINUTES };
