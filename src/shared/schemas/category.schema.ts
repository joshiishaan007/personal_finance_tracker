import { z } from 'zod';

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(10).default('📦'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  // `reimbursement` is for money returned to you (e.g. a friend repaying a debt).
  // It is excluded from the spending-plan base income so it doesn't inflate it.
  type: z.enum(['income', 'expense', 'transfer', 'investment', 'reimbursement']),
  parentCategoryId: z.string().optional(),
  // `isDefault` is a server/seed-only flag — NEVER client-writable. A user-owned
  // doc with isDefault:true would leak into every tenant via the global-default
  // branch of category queries. Seeds set it directly on the model.
  monthlyBudget: z.number().int().positive().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

export type CreateCategory = z.infer<typeof CreateCategorySchema>;
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;
