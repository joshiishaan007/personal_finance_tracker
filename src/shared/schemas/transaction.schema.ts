import { z } from 'zod';

export const TransactionTypeEnum = z.enum(['income', 'expense', 'transfer', 'investment']);
export const PaymentMethodEnum = z.enum(['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'other']);

export const CreateTransactionSchema = z.object({
  amount: z.number().int().positive(),
  type: TransactionTypeEnum,
  categoryId: z.string(),
  subcategoryId: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  date: z.string().datetime(),
  note: z.string().max(500).optional(),
  paymentMethod: PaymentMethodEnum.default('cash'),
  isRecurring: z.boolean().default(false),
  recurringRuleId: z.string().optional(),
  goalId: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  importBatchId: z.string().optional(),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial().omit({ importBatchId: true });

export const TransactionFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: TransactionTypeEnum.optional(),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  minAmount: z.coerce.number().int().optional(),
  maxAmount: z.coerce.number().int().optional(),
  paymentMethod: PaymentMethodEnum.optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

export const CSVImportMappingSchema = z.object({
  dateColumn: z.string(),
  amountColumn: z.string(),
  typeColumn: z.string().optional(),
  noteColumn: z.string().optional(),
  categoryColumn: z.string().optional(),
  defaultCategoryId: z.string().optional(),
  dateFormat: z.string().default('YYYY-MM-DD'),
  amountIsMinorUnits: z.boolean().default(false),
  defaultType: z.enum(['income', 'expense']).default('expense'),
});

export type CreateTransaction = z.infer<typeof CreateTransactionSchema>;
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>;
export type TransactionFilter = z.infer<typeof TransactionFilterSchema>;
export type CSVImportMapping = z.infer<typeof CSVImportMappingSchema>;
