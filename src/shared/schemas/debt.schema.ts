import { z } from 'zod';

export const CreateDebtSchema = z.object({
  friendName:    z.string().min(1).max(80),
  amount:        z.number().int().positive(),
  note:          z.string().max(300).optional(),
  // sourceTxId links this debt to the expense/transfer transaction it was split from.
  sourceTxId:    z.string().optional(),
  // transactionId holds the reimbursement income tx created when the debt is settled.
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
  sourceTxId: z.string().optional(),
});

export type CreateDebt = z.infer<typeof CreateDebtSchema>;
export type UpdateDebt = z.infer<typeof UpdateDebtSchema>;
export type DebtFilter = z.infer<typeof DebtFilterSchema>;

export interface DebtView {
  _id:            string;
  friendName:     string;
  amount:         number;
  note?:          string;
  sourceTxId?:    string;
  transactionId?: string;
  status:         'pending' | 'settled';
  createdAt:      string;
}

export interface DebtSummaryItem {
  friendName: string;
  total:      number;
  count:      number;
}
