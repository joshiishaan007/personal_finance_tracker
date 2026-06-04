import { z } from 'zod';

// A user-defined allocation bucket (e.g. Needs 50%, Wants 30%, Savings 20%).
// `id` is a stable client-generated key so category assignments survive renames.
export const AllocationBucketSchema = z.object({
  id: z.string().min(1).max(40),
  name: z.string().min(1).max(40),
  percent: z.number().min(0).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  // `savings` buckets count investment/savings outflow as "progress" rather than
  // "spend"; needs/wants/custom count as spend against the allocation.
  kind: z.enum(['needs', 'wants', 'savings', 'custom']).default('custom'),
});

// One plan document per user: the editable buckets + a categoryId -> bucketId map.
export const SpendingPlanSchema = z.object({
  buckets: z.array(AllocationBucketSchema).max(12),
  assignments: z.record(z.string(), z.string()).default({}),
});

export const UpdateSpendingPlanSchema = SpendingPlanSchema.partial();

export type AllocationBucket = z.infer<typeof AllocationBucketSchema>;
export type SpendingPlanInput = z.infer<typeof SpendingPlanSchema>;
export type UpdateSpendingPlan = z.infer<typeof UpdateSpendingPlanSchema>;

// --- Computed response shapes (server-derived, not persisted) ---

export interface SpendingCycle {
  start: string; // ISO
  end: string; // ISO
  baseIncome: number; // minor units — the 100% the percentages apply to
  source: 'salary' | 'income-sum' | 'none';
  label: string; // e.g. "12 May – 11 Jun"
}

export interface BucketComputed extends AllocationBucket {
  allocated: number; // minor units = percent% of baseIncome
  used: number; // minor units summed from assigned categories this cycle
  remaining: number; // allocated - used
  usedPctOfAllocated: number; // 0..100+ (rounded)
  usedPctOfBase: number; // share of total income this bucket consumed
}

export interface SpendingPlanView {
  buckets: BucketComputed[];
  assignments: Record<string, string>;
  cycle: SpendingCycle;
  currency: string;
  totalPercent: number; // sum of bucket percents (should be 100)
  unassignedCategoryIds: string[];
}
