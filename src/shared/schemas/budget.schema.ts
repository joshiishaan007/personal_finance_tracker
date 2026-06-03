import { z } from 'zod';

export const CreateBudgetSchema = z.object({
  categoryId: z.string(),
  amount: z.number().int().positive(),
  period: z.enum(['monthly', 'yearly']).default('monthly'),
  startDate: z.string().datetime(),
  rollover: z.boolean().default(false),
});

export const UpdateBudgetSchema = CreateBudgetSchema.partial();

export type CreateBudget = z.infer<typeof CreateBudgetSchema>;
export type UpdateBudget = z.infer<typeof UpdateBudgetSchema>;
