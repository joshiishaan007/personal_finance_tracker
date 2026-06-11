import { z } from 'zod';

// Direction of the obligation:
//   they_owe_me — money others owe you (lending; settle creates income)
//   i_owe_them  — money you owe others (borrowing; settle creates expense)
export const DebtDirectionEnum = z.enum(['they_owe_me', 'i_owe_them']);

export const CreateDebtSchema = z.object({
  friendName:    z.string().min(1).max(80),
  amount:        z.number().int().positive(),
  note:          z.string().max(300).optional(),
  direction:     DebtDirectionEnum.default('they_owe_me'),
  // The actual date the money was used (you paid for them / they paid for you),
  // distinct from the cash-movement date of the settlement transaction.
  incurredAt:    z.string().datetime().optional(),
  // Captured at entry for i_owe_them so the repayment expense reuses them on settle.
  categoryId:    z.string().optional(),
  paymentMethod: z.string().optional(),
  // sourceTxId links this debt to the expense/transfer transaction it was split from.
  sourceTxId:    z.string().optional(),
  // transactionId holds the settlement tx (income on lend, expense on borrow).
  transactionId: z.string().optional(),
});

export const UpdateDebtSchema = z.object({
  amount:        z.number().int().positive().optional(),
  status:        z.enum(['pending', 'settled']).optional(),
  note:          z.string().max(300).optional(),
  incurredAt:    z.string().datetime().optional(),
  categoryId:    z.string().optional(),
  paymentMethod: z.string().optional(),
  transactionId: z.string().optional(),
});

export const DebtFilterSchema = z.object({
  status:     z.enum(['pending', 'settled', 'all']).default('pending'),
  direction:  z.enum(['they_owe_me', 'i_owe_them', 'all']).default('they_owe_me'),
  friendName: z.string().optional(),
  sourceTxId: z.string().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
});

export const DebtSummaryQuerySchema = z.object({
  direction: z.enum(['they_owe_me', 'i_owe_them']).default('they_owe_me'),
});

export type DebtDirection = z.infer<typeof DebtDirectionEnum>;
export type CreateDebt = z.infer<typeof CreateDebtSchema>;
export type UpdateDebt = z.infer<typeof UpdateDebtSchema>;
export type DebtFilter = z.infer<typeof DebtFilterSchema>;

export interface DebtView {
  _id:            string;
  friendName:     string;
  amount:         number;
  note?:          string;
  direction:      DebtDirection;
  incurredAt?:    string;
  categoryId?:    string;
  paymentMethod?: string;
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

export interface DebtListResult {
  items:   DebtView[];
  total:   number;
  hasMore: boolean;
}
