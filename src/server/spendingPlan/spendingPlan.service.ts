import { spendingPlanRepository as repo } from './spendingPlan.repository';
import { resolveIncomeCycle, type IncomeRow } from '../finance/incomeCycle';
import type {
  AllocationBucket,
  BucketComputed,
  SpendingPlanView,
  SpendingPlanHistoryMonth,
  UpdateSpendingPlan,
} from '@/shared';

function monthLabel(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(d);
}

// Default 50/30/20 plan used when the user has no saved doc.
const DEFAULT_BUCKETS: AllocationBucket[] = [
  { id: 'needs', name: 'Needs', percent: 50, color: '#0EA5E9', kind: 'needs' },
  { id: 'wants', name: 'Wants', percent: 30, color: '#8B5CF6', kind: 'wants' },
  { id: 'savings', name: 'Savings', percent: 20, color: '#10B981', kind: 'savings' },
];

interface SpendRow {
  _id: unknown;
  total: number;
}

function buildView(
  buckets: AllocationBucket[],
  assignments: Record<string, string>,
  baseIncome: number,
  spendRows: SpendRow[],
  categoryIds: string[],
  cycle: { start: Date; end: Date; source: 'salary' | 'income-sum' | 'none'; label: string },
  currency: string,
): SpendingPlanView {
  const spendByCat = new Map<string, number>();
  for (const r of spendRows) spendByCat.set(String(r._id), r.total);

  // bucketId -> used (sum of spend across its assigned categories).
  const usedByBucket = new Map<string, number>();
  for (const [categoryId, bucketId] of Object.entries(assignments)) {
    const spend = spendByCat.get(categoryId);
    if (spend) usedByBucket.set(bucketId, (usedByBucket.get(bucketId) ?? 0) + spend);
  }

  const computed: BucketComputed[] = buckets.map((b) => {
    const allocated = Math.round((baseIncome * b.percent) / 100);
    const used = usedByBucket.get(b.id) ?? 0;
    return {
      ...b,
      allocated,
      used,
      remaining: allocated - used,
      usedPctOfAllocated: allocated > 0 ? Math.round((used / allocated) * 100) : 0,
      usedPctOfBase: baseIncome > 0 ? Math.round((used / baseIncome) * 100) : 0,
    };
  });

  const totalPercent = buckets.reduce((s, b) => s + b.percent, 0);
  const unassignedCategoryIds = categoryIds.filter((id) => !assignments[id]);

  return {
    buckets: computed,
    assignments,
    cycle: {
      start: cycle.start.toISOString(),
      end: cycle.end.toISOString(),
      baseIncome,
      source: cycle.source,
      label: cycle.label,
    },
    currency,
    totalPercent,
    unassignedCategoryIds,
  };
}

export const spendingPlanService = {
  async view(userId: string): Promise<SpendingPlanView> {
    const [plan, currency, categories] = await Promise.all([
      repo.getPlan(userId),
      repo.currency(userId),
      repo.listCategories(userId),
    ]);

    const buckets: AllocationBucket[] = plan?.buckets?.length ? plan.buckets : DEFAULT_BUCKETS;
    const assignments: Record<string, string> = plan?.assignments ?? {};

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const incomeRows = await repo.recentIncomes(userId, monthStart);
    const incomes: IncomeRow[] = incomeRows.map((r) => ({ date: new Date(r.date), amount: r.amount }));
    const cycle = resolveIncomeCycle(incomes, now);

    const spendRows = await repo.spendByCategory(userId, cycle.start, cycle.end);
    const categoryIds = categories.map((c) => String(c._id));

    const result = buildView(buckets, assignments, cycle.baseIncome, spendRows, categoryIds, cycle, currency);

    // Freeze this month's snapshot for history — live-upserted on each load, then
    // naturally frozen once the month passes (no later load re-touches a past month).
    const hasActivity = cycle.baseIncome > 0 || result.buckets.some((b) => b.used > 0);
    if (hasActivity) {
      await repo.upsertHistory(userId, monthStart, {
        baseIncome: cycle.baseIncome,
        currency,
        buckets: result.buckets.map((b) => ({
          id: b.id, name: b.name, color: b.color, kind: b.kind,
          percent: b.percent, allocated: b.allocated, spent: b.used,
        })),
        schemaVersion: 1,
      });
    }

    return result;
  },

  async history(userId: string): Promise<SpendingPlanHistoryMonth[]> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rows = await repo.listHistory(userId, monthStart, 24);
    return rows.map((r) => ({
      month:      new Date(r.month).toISOString(),
      label:      monthLabel(new Date(r.month)),
      baseIncome: r.baseIncome,
      currency:   r.currency,
      buckets:    r.buckets.map((b) => ({
        id: b.id, name: b.name, color: b.color, kind: b.kind,
        percent: b.percent, allocated: b.allocated, spent: b.spent,
      })),
    }));
  },

  async update(userId: string, data: UpdateSpendingPlan): Promise<SpendingPlanView> {
    await repo.upsertPlan(userId, data as Record<string, unknown>);
    return spendingPlanService.view(userId);
  },
};
