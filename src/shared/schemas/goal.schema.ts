import { z } from 'zod';
import { moneyMinor, moneyMinorPositive } from './money';

export const CreateGoalSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: moneyMinorPositive,
  savedAmount: moneyMinor.default(0),
  deadline: z.string().datetime().optional(),
  icon: z.string().max(10).default('🎯'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  status: z.enum(['active', 'achieved', 'paused']).default('active'),
});

export const UpdateGoalSchema = CreateGoalSchema.partial();

export type CreateGoal = z.infer<typeof CreateGoalSchema>;
export type UpdateGoal = z.infer<typeof UpdateGoalSchema>;
