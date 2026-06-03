import { z } from 'zod';
import { TransactionTypeEnum, PaymentMethodEnum } from './transaction.schema';

export const QuickParseRequestSchema = z.object({
  text: z.string().min(1).max(200),
});

// Gemini's structured draft for natural-language quick-add. `amount` is in MAJOR
// display units (e.g. rupees) — the client converts to minor units before saving,
// mirroring the manual form.
export const ParsedDraftSchema = z.object({
  amount: z.number().positive(),
  type: TransactionTypeEnum,
  categoryId: z.string().min(1),
  paymentMethod: PaymentMethodEnum,
  note: z.string().max(500).optional(),
});

export type QuickParseRequest = z.infer<typeof QuickParseRequestSchema>;
export type ParsedDraft = z.infer<typeof ParsedDraftSchema>;
