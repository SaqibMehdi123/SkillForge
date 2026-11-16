/**
 * Server-authoritative achievement catalog (audit fix S3).
 *
 * Before this module the client dictated its own XP rewards
 * (POST /api/achievements with xpReward: 100000 minted level 45 in one
 * request) and the streak it "claimed" ({"streak": 999} unlocked every
 * streak badge + 1500 XP). Now:
 *   - XP rewards exist ONLY here, keyed by badgeId;
 *   - unknown badges can still be RECORDED (the achievements page syncs
 *     client-known badges) but they never mint XP;
 *   - streak achievements are evaluated against the SERVER-computed
 *     Streak collection, never the request body.
 */
const XP_REWARDS = {
  first_steps: 100,
  streak_starter: 150,
  streak_warrior: 350,
  streak_master: 1000,
};

const STREAK_ACHIEVEMENTS = [
  {
    badgeId: 'streak_starter',
    name: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    type: 'streak',
    icon: 'FireIcon',
    requiredStreak: 3,
  },
  {
    badgeId: 'streak_warrior',
    name: 'Streak Warrior',
    description: 'Maintain a 7-day streak',
    type: 'streak',
    icon: 'FireIcon',
    requiredStreak: 7,
  },
  {
    badgeId: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 30-day streak',
    type: 'streak',
    icon: 'FireIcon',
    requiredStreak: 30,
  },
];

/** The only XP a badge can ever grant. Unknown badges grant 0. */
function xpRewardFor(badgeId) {
  return XP_REWARDS[badgeId] || 0;
}

/** User-reported streak numbers are clamped to sane integer bounds. */
const MAX_REPORTED_STREAK = 9999;

function clampReportedStreak(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return null; // caller decides how to reject
  return Math.min(n, MAX_REPORTED_STREAK);
}

module.exports = {
  XP_REWARDS,
  STREAK_ACHIEVEMENTS,
  xpRewardFor,
  clampReportedStreak,
  MAX_REPORTED_STREAK,
};
