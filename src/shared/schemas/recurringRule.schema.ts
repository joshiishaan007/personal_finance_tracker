import { z } from 'zod';

export const CreateRecurringRuleSchema = z.object({
  templateTransaction: z.object({
    amount: z.number().int().positive(),
    type: z.enum(['income', 'expense', 'transfer', 'investment']),
    categoryId: z.string(),
    tags: z.array(z.string()).default([]),
    note: z.string().max(500).optional(),
    paymentMethod: z.enum(['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'other']).default('cash'),
    goalId: z.string().optional(),
  }),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  nextDueDate: z.string().datetime(),
  autoPost: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const UpdateRecurringRuleSchema = CreateRecurringRuleSchema.partial();

export type CreateRecurringRule = z.infer<typeof CreateRecurringRuleSchema>;
export type UpdateRecurringRule = z.infer<typeof UpdateRecurringRuleSchema>;
