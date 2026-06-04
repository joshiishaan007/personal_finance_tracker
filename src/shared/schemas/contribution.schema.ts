import { z } from 'zod';

// A dated progress log toward a life goal (e.g. "read 30 pages", "ran 5 km").
// Increments the parent goal's currentValue.
export const CreateContributionSchema = z.object({
  goalId: z.string().min(1),
  date: z.string().datetime().optional(), // defaults to now server-side
  value: z.number().default(1),
  note: z.string().max(500).optional(),
});

export const ContributionFilterSchema = z.object({
  goalId: z.string().optional(),
});

export type CreateContribution = z.infer<typeof CreateContributionSchema>;
export type ContributionFilter = z.infer<typeof ContributionFilterSchema>;
