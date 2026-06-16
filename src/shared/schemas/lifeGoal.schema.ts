import { z } from 'zod';

export const LifeGoalAreaEnum = z.enum([
  'health', 'career', 'learning', 'finance', 'personal', 'relationships', 'other',
]);
export const LifeGoalStatusEnum = z.enum(['active', 'achieved', 'paused', 'archived']);

export const CreateLifeGoalSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  area: LifeGoalAreaEnum.default('personal'),
  icon: z.string().max(10).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#14B8A6'),
  status: LifeGoalStatusEnum.default('active'),
  // Measurable goals set targetValue (+ unit); otherwise manualProgress (0–100).
  targetValue: z.number().positive().optional(),
  // A per-day target (e.g. 15 pages/day) marks this a daily habit: the goals home
  // shows today's progress + streak and offers one-tap "log today".
  dailyTarget: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
  currentValue: z.number().min(0).default(0),
  manualProgress: z.number().min(0).max(100).optional(),
  targetDate: z.string().datetime().optional(),
});

export const UpdateLifeGoalSchema = CreateLifeGoalSchema.partial();

export type CreateLifeGoal = z.infer<typeof CreateLifeGoalSchema>;
export type UpdateLifeGoal = z.infer<typeof UpdateLifeGoalSchema>;
export type LifeGoalArea = z.infer<typeof LifeGoalAreaEnum>;
export type LifeGoalStatus = z.infer<typeof LifeGoalStatusEnum>;
