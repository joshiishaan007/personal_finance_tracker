import { z } from 'zod';

export const CreateDebtSchema = z.object({
  friendName:    z.string().min(1).max(80),
  amount:        z.number().int().positive(),
  note:          z.string().max(300).optional(),
  transactionId: z.string().optional(),
});

export const UpdateDebtSchema = z.object({
  amount:        z.number().int().positive().optional(),
  status:        z.enum(['pending', 'settled']).optional(),
  transactionId: z.string().optional(),
});

export const DebtFilterSchema = z.object({
  status:     z.enum(['pending', 'settled', 'all']).default('pending'),
  friendName: z.string().optional(),
});

export type CreateDebt = z.infer<typeof CreateDebtSchema>;
export type UpdateDebt = z.infer<typeof UpdateDebtSchema>;
export type DebtFilter = z.infer<typeof DebtFilterSchema>;

export interface DebtView {
  _id:           string;
  friendName:    string;
  amount:        number;
  note?:         string;
  transactionId?: string;
  status:        'pending' | 'settled';
  createdAt:     string;
}

export interface DebtSummaryItem {
  friendName: string;
  total:      number;
  count:      number;
}
