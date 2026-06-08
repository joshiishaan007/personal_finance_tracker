import { z } from 'zod';
import { moneyMinorPositive } from './money';

export const CreateRecurringRuleSchema = z.object({
  templateTransaction: z.object({
    amount: moneyMinorPositive,
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
  // Reject an absurdly far-past start (the generate() loop also hard-caps
  // iterations, but block the obvious amplification input at the boundary).
  nextDueDate: z
    .string()
    .datetime()
    .refine((d) => Date.parse(d) >= Date.now() - 2 * 365 * 24 * 60 * 60 * 1000, {
      message: 'nextDueDate cannot be more than 2 years in the past',
    }),
  autoPost: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const UpdateRecurringRuleSchema = CreateRecurringRuleSchema.partial();

export type CreateRecurringRule = z.infer<typeof CreateRecurringRuleSchema>;
export type UpdateRecurringRule = z.infer<typeof UpdateRecurringRuleSchema>;
