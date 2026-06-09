import { z } from 'zod';

// A dated progress log toward a life goal (e.g. "read 30 pages", "ran 5 km").
// Increments the parent goal's currentValue.
export const CreateContributionSchema = z.object({
  goalId: z.string().min(1),
  date: z.string().datetime().optional(), // defaults to now server-side
  // Bounded integer — applied to the goal via $inc, so an unbounded/NaN/huge
  // value would corrupt currentValue and the heatmap aggregation.
  value: z.number().int().min(-1_000_000).max(1_000_000).default(1),
  note: z.string().max(500).optional(),
});

export const ContributionFilterSchema = z.object({
  goalId: z.string().optional(),
});

export const ContributionHeatmapQuerySchema = z.object({
  goalId: z.string().optional(),
  from: z.string().min(1),
  to: z.string().min(1),
});

export type CreateContribution = z.infer<typeof CreateContributionSchema>;
export type ContributionFilter = z.infer<typeof ContributionFilterSchema>;
export type ContributionHeatmapQuery = z.infer<typeof ContributionHeatmapQuerySchema>;
