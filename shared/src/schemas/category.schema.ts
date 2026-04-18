import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(10).default('📦'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  type: z.enum(['income', 'expense', 'transfer', 'investment']),
  parentCategoryId: z.string().optional(),
  isDefault: z.boolean().default(false),
  monthlyBudget: z.number().int().positive().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
