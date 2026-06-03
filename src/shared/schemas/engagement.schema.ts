import { z } from 'zod';

// Daily engagement snapshot for the streak badge + end-of-day card.
// Money fields (todaySpent, todayIncome, avgDailySpend) are in minor units.
export const DailyEngagementSchema = z.object({
  streak: z.number().int().nonnegative(),
  todayCount: z.number().int().nonnegative(),
  todaySpent: z.number().int().nonnegative(),
  todayIncome: z.number().int().nonnegative(),
  avgDailySpend: z.number().int().nonnegative(),
});

export type DailyEngagement = z.infer<typeof DailyEngagementSchema>;
