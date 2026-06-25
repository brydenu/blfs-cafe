const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** When user statistics launched on the dashboard */
const STATISTICS_FEATURE_LAUNCHED_AT = new Date("2026-06-25T00:00:00");

const STATISTICS_NEW_BADGE_DAYS = 14;

export function isStatisticsNewBadgeActive(now: Date = new Date()): boolean {
  const elapsed = now.getTime() - STATISTICS_FEATURE_LAUNCHED_AT.getTime();
  return elapsed >= 0 && elapsed < STATISTICS_NEW_BADGE_DAYS * MS_PER_DAY;
}
