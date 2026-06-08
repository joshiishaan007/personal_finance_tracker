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

export type CreateInstantCard = z.infer<typeof CreateInstantCardSchema>;

export interface InstantCardView {
  _id:           string;
  amount:        number;
  type:          string;
  categoryId:    string;
  paymentMethod: string;
  note?:         string;
  tags:          string[];
}
