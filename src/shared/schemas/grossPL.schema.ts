import { z } from 'zod';
import { moneySignedMinor } from './money';

// A manually-entered monthly profit/loss figure that accumulates into a running
// gross total (e.g. May +3000, Jun -200 => cumulative +2800). One entry per month.
export const CreateGrossPLSchema = z.object({
  // First instant of the month this entry applies to (ISO). Unique per (user, month).
  month: z.string().datetime(),
  // Signed minor units: positive = profit, negative = loss.
  amount: moneySignedMinor,
  note: z.string().max(200).optional(),
});

export const UpdateGrossPLSchema = CreateGrossPLSchema.partial();

export type CreateGrossPL = z.infer<typeof CreateGrossPLSchema>;
export type UpdateGrossPL = z.infer<typeof UpdateGrossPLSchema>;

export interface GrossPLEntryView {
  _id: string;
  month: string; // ISO (first of month)
  amount: number; // signed minor units
  note?: string;
}

export interface GrossPLSummary {
  entries: GrossPLEntryView[]; // ascending by month
  cumulative: number; // running gross total (minor units)
  cumulativeSeries: Array<{ month: string; value: number }>; // running total per month
  currency: string;
}
