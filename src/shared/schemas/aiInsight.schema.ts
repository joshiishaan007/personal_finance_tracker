import { z } from 'zod';

export const InsightTypeEnum = z.enum([
  'spending_anomaly',
  'savings_opportunity',
  'cashflow_warning',
  'goal_projection',
  'encouragement',
]);

export const InsightSchema = z.object({
  type: InsightTypeEnum,
  title: z.string().max(80),
  body: z.string(),
  why: z.string(),
  dataPoints: z.record(z.string(), z.number()),
});

export type Insight = z.infer<typeof InsightSchema>;
