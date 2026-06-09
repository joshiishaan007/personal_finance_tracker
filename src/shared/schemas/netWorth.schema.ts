import { z } from 'zod';
import { moneyMinor } from './money';

export const AssetsSchema = z.object({
  cash: moneyMinor.default(0),
  bank: moneyMinor.default(0),
  property: moneyMinor.default(0),
  vehicles: moneyMinor.default(0),
  other: moneyMinor.default(0),
});

export const LiabilitiesSchema = z.object({
  loans: moneyMinor.default(0),
  credit: moneyMinor.default(0),
  other: moneyMinor.default(0),
});

export const UpsertNetWorthSchema = z.object({
  assets: AssetsSchema,
  liabilities: LiabilitiesSchema,
});

export type UpsertNetWorth = z.infer<typeof UpsertNetWorthSchema>;
