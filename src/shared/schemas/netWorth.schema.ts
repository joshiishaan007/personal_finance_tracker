import { z } from 'zod';

export const AssetsSchema = z.object({
  cash: z.number().int().default(0),
  bank: z.number().int().default(0),
  property: z.number().int().default(0),
  vehicles: z.number().int().default(0),
  other: z.number().int().default(0),
});

export const LiabilitiesSchema = z.object({
  loans: z.number().int().default(0),
  credit: z.number().int().default(0),
  other: z.number().int().default(0),
});

export const UpsertNetWorthSchema = z.object({
  assets: AssetsSchema,
  liabilities: LiabilitiesSchema,
});

export type UpsertNetWorth = z.infer<typeof UpsertNetWorthSchema>;
