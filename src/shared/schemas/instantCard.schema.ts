import { z } from 'zod';
import { TransactionTypeEnum, PaymentMethodEnum } from './transaction.schema';

export const CreateInstantCardSchema = z.object({
  amount:        z.number().int().positive(),
  type:          TransactionTypeEnum,
  categoryId:    z.string().min(1),
  paymentMethod: PaymentMethodEnum.default('cash'),
  note:          z.string().max(500).optional(),
  tags:          z.array(z.string().max(50)).max(10).default([]),
});

export const UpdateInstantCardSchema = CreateInstantCardSchema.partial();

export const ReorderInstantCardsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
});

export type CreateInstantCard = z.infer<typeof CreateInstantCardSchema>;
export type UpdateInstantCard = z.infer<typeof UpdateInstantCardSchema>;
export type ReorderInstantCards = z.infer<typeof ReorderInstantCardsSchema>;

export interface InstantCardView {
  _id:           string;
  amount:        number;
  type:          string;
  categoryId:    string;
  paymentMethod: string;
  note?:         string;
  tags:          string[];
}
