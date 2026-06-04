import { spendingPlanRepository as repo } from './spendingPlan.repository';
import { resolveIncomeCycle, type IncomeRow } from '../finance/incomeCycle';
import type {
  AllocationBucket,
  BucketComputed,
  SpendingPlanView,
  UpdateSpendingPlan,
} from '@/shared';

const DAY = 86_400_000;
const INCOME_WINDOW_DAYS = 180;

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

    const since = new Date(Date.now() - INCOME_WINDOW_DAYS * DAY);
    const incomeRows = await repo.recentIncomes(userId, since);
    const incomes: IncomeRow[] = incomeRows.map((r) => ({ date: new Date(r.date), amount: r.amount }));
    const cycle = resolveIncomeCycle(incomes, new Date());

    const spendRows = await repo.spendByCategory(userId, cycle.start, cycle.end);
    const categoryIds = categories.map((c) => String(c._id));

    return buildView(buckets, assignments, cycle.baseIncome, spendRows, categoryIds, cycle, currency);
  },

  async update(userId: string, data: UpdateSpendingPlan): Promise<SpendingPlanView> {
    await repo.upsertPlan(userId, data as Record<string, unknown>);
    return spendingPlanService.view(userId);
  },
};
