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
  // Weekdays the habit is scheduled on (0=Sun … 6=Sat). Empty/undefined = every
  // day. Non-scheduled days are "rest days" and don't break the streak.
  trackDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  unit: z.string().max(20).optional(),
  currentValue: z.number().min(0).default(0),
  manualProgress: z.number().min(0).max(100).optional(),
  targetDate: z.string().datetime().optional(),
});

// On update, an explicit null clears the field (mapped to $unset server-side);
// an absent key leaves the stored value untouched.
export const UpdateLifeGoalSchema = CreateLifeGoalSchema.partial().extend({
  description: z.string().max(1000).nullable().optional(),
  targetValue: z.number().positive().nullable().optional(),
  dailyTarget: z.number().positive().nullable().optional(),
  trackDays: z.array(z.number().int().min(0).max(6)).max(7).nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  manualProgress: z.number().min(0).max(100).nullable().optional(),
  targetDate: z.string().datetime().nullable().optional(),
});

export type CreateLifeGoal = z.infer<typeof CreateLifeGoalSchema>;
export type UpdateLifeGoal = z.infer<typeof UpdateLifeGoalSchema>;
export type LifeGoalArea = z.infer<typeof LifeGoalAreaEnum>;
export type LifeGoalStatus = z.infer<typeof LifeGoalStatusEnum>;
