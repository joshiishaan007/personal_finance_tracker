import { fmt } from '@/lib/utils';

// Rule-based, on-device financial insights. Pure and deterministic: it only reads
// figures the app already computed, so nothing ever leaves the device (no AI, no
// network). The dashboard widget feeds it cached query data.

export type InsightTone = 'positive' | 'info' | 'warning' | 'danger';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
}

export interface InsightInput {
  currency: string;
  summary: { income: number; expense: number; net: number; savingsRate: number };
  topCategories: Array<{ name: string; total: number }>;
  buckets: Array<{ name: string; kind: string; used: number; allocated: number; remaining: number }>;
  planHasIncome: boolean;
  upcoming: { count: number; total: number };
  prevNet: number | null;
}

const TONE_ORDER: Record<InsightTone, number> = { danger: 0, warning: 1, info: 2, positive: 3 };

export function deriveInsights(input: InsightInput): Insight[] {
  const { currency, summary, topCategories, buckets, planHasIncome, upcoming, prevNet } = input;
  const f = (n: number) => fmt(n, currency);
  const out: Insight[] = [];

  // 1. Savings rate health (only meaningful once there's income).
  if (summary.income > 0) {
    if (summary.net < 0) {
      out.push({ id: 'overspend', tone: 'danger', title: 'Spending over income', detail: `You've spent ${f(summary.expense)} against ${f(summary.income)} this month.` });
    } else if (summary.savingsRate >= 30) {
      out.push({ id: 'great-savings', tone: 'positive', title: 'Strong saver', detail: `You're saving ${Math.round(summary.savingsRate)}% of income this month — keep it up.` });
    } else if (summary.savingsRate < 10) {
      out.push({ id: 'low-savings', tone: 'warning', title: 'Low savings rate', detail: `Only ${Math.round(summary.savingsRate)}% saved so far — small cuts add up.` });
    }
  }

  // 2. Net vs last month.
  if (prevNet !== null) {
    const delta = summary.net - prevNet;
    if (delta <= -1000) {
      out.push({ id: 'net-down', tone: 'warning', title: 'Down vs last month', detail: `This month's net is ${f(-delta)} lower than last month.` });
    } else if (delta >= 1000) {
      out.push({ id: 'net-up', tone: 'positive', title: 'Up vs last month', detail: `This month's net is ${f(delta)} higher than last month.` });
    }
  }

  // 3. Spending concentration in the top category.
  if (summary.expense > 0 && topCategories[0]) {
    const share = Math.round((topCategories[0].total / summary.expense) * 100);
    if (share >= 40) {
      out.push({ id: 'concentration', tone: 'info', title: `${topCategories[0].name} dominates spending`, detail: `${topCategories[0].name} is ${share}% of this month's expenses.` });
    }
  }

  // 4. Spending-plan buckets — over, then close to the limit.
  if (planHasIncome) {
    for (const b of buckets.filter((x) => x.kind !== 'savings' && x.remaining < 0).slice(0, 2)) {
      out.push({ id: `over-${b.name}`, tone: 'danger', title: `Over on ${b.name}`, detail: `You're ${f(-b.remaining)} past the ${b.name} allocation.` });
    }
    for (const b of buckets.filter((x) => x.kind !== 'savings' && x.remaining >= 0 && x.allocated > 0 && x.used / x.allocated >= 0.85).slice(0, 2)) {
      out.push({ id: `near-${b.name}`, tone: 'warning', title: `Close to ${b.name} limit`, detail: `${Math.round((b.used / b.allocated) * 100)}% of ${b.name} used — ${f(b.remaining)} left.` });
    }
  }

  // 5. Upcoming recurring payments.
  if (upcoming.count > 0) {
    out.push({ id: 'upcoming', tone: 'info', title: `${upcoming.count} payment${upcoming.count === 1 ? '' : 's'} due soon`, detail: `About ${f(upcoming.total)} due in the next 7 days.` });
  }

  return out.sort((a, b) => TONE_ORDER[a.tone] - TONE_ORDER[b.tone]).slice(0, 6);
}
