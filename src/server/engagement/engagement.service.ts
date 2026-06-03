import { engagementRepository as repo } from './engagement.repository';
import type { DailyEngagement } from '@/shared';

// 'YYYY-MM-DD' for an instant in a given IANA timezone. en-CA formats as ISO date.
function dayStringInTz(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function prevDay(dayStr: string): string {
  const d = new Date(`${dayStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Consecutive days (ending today, or yesterday if today isn't logged yet) that have
// activity. The yesterday grace means the streak doesn't "break" until a full day
// with no logging has passed. Pure + exported for unit testing.
export function computeStreak(days: string[], todayStr: string, yesterdayStr: string): number {
  const set = new Set(days);
  let cursor: string;
  if (set.has(todayStr)) cursor = todayStr;
  else if (set.has(yesterdayStr)) cursor = yesterdayStr;
  else return 0;

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = prevDay(cursor);
  }
  return streak;
}

const DAY_MS = 86_400_000;

export const engagementService = {
  async daily(userId: string): Promise<DailyEngagement> {
    const { timezone } = await repo.userMeta(userId);
    const now = new Date();
    // ~400 days back is plenty to measure any realistic streak in one query.
    const since = new Date(now.getTime() - 400 * DAY_MS);
    const rollup = await repo.dailyRollup(userId, since, timezone);

    const todayStr = dayStringInTz(now, timezone);
    const yesterdayStr = dayStringInTz(new Date(now.getTime() - DAY_MS), timezone);
    const streak = computeStreak(rollup.map((r) => r.day), todayStr, yesterdayStr);

    const today = rollup.find((r) => r.day === todayStr);

    // 30-day average daily spend (fixed /30 denominator, so it counts zero-spend days).
    const cutoff = dayStringInTz(new Date(now.getTime() - 29 * DAY_MS), timezone);
    const last30Expense = rollup
      .filter((r) => r.day >= cutoff)
      .reduce((s, r) => s + r.expense, 0);

    return {
      streak,
      todayCount: today?.count ?? 0,
      todaySpent: today?.expense ?? 0,
      todayIncome: today?.income ?? 0,
      avgDailySpend: Math.round(last30Expense / 30),
    };
  },
};
