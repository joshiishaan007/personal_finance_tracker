import { z } from 'zod';

// Validates a JSON backup produced by the export endpoint before it is merged
// back in. Permissive (passthrough) so a backup from a newer schema version with
// extra fields still imports; the server maps only the fields it understands.
const ImportCategorySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.string().min(1),
  userId: z.string().nullish(),
  isDefault: z.boolean().optional(),
}).passthrough();

const ImportTransactionSchema = z.object({
  _id: z.string().optional(),
  amount: z.number(),
  type: z.string().min(1),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  date: z.string().min(1),
  note: z.string().optional(),
  paymentMethod: z.string().optional(),
  isRecurring: z.boolean().optional(),
  hash: z.string().optional(),
}).passthrough();

const ImportBudgetSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number(),
  period: z.string().optional(),
  startDate: z.string().optional(),
  rollover: z.boolean().optional(),
  rolloverBalance: z.number().optional(),
}).passthrough();

const ImportGoalSchema = z.object({
  title: z.string().min(1),
  targetAmount: z.number(),
  savedAmount: z.number().optional(),
  deadline: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  status: z.string().optional(),
  milestonesHit: z.array(z.number()).optional(),
}).passthrough();

export const ImportBackupSchema = z.object({
  schemaVersion: z.number().optional(),
  categories: z.array(ImportCategorySchema).max(2000).default([]),
  transactions: z.array(ImportTransactionSchema).max(50_000).default([]),
  budgets: z.array(ImportBudgetSchema).max(2000).default([]),
  goals: z.array(ImportGoalSchema).max(2000).default([]),
}).passthrough();

export type ImportBackup = z.infer<typeof ImportBackupSchema>;

export interface ImportResult {
  categories: number;
  transactions: number;
  budgets: number;
  goals: number;
  skipped: number;
}
