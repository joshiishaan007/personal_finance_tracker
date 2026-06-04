import { z } from 'zod';

export const InvestmentKindEnum = z.enum(['fd', 'rd', 'sip', 'equity', 'ppf']);
export const CompoundingEnum = z.enum(['monthly', 'quarterly', 'halfyearly', 'yearly']);
export const InvestmentStatusEnum = z.enum(['active', 'matured', 'closed']);

// `investedAmount` is server-managed (auto-accumulated from linked transactions),
// so it is NOT part of the create/update input.
export const CreateInvestmentSchema = z.object({
  name: z.string().min(1).max(80),
  kind: InvestmentKindEnum,
  icon: z.string().max(10).default('💹'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  startDate: z.string().datetime(),
  // Annual interest rate (FD/RD/PPF) or expected annual return % (SIP/equity).
  ratePct: z.number().min(0).max(100).optional(),
  // Investment horizon in months (FD/RD/PPF/SIP). Drives the maturity date.
  tenureMonths: z.number().int().positive().max(1200).optional(),
  // Compounding frequency for FD/PPF.
  compounding: CompoundingEnum.optional(),
  // Lump-sum principal in minor units (FD / equity lump). Optional seed; the real
  // invested figure is `investedAmount`, accumulated from linked transactions.
  principal: z.number().int().min(0).optional(),
  // Per-month contribution in minor units (RD / SIP / PPF).
  monthlyAmount: z.number().int().min(0).optional(),
  // Market-linked manual current value in minor units (equity/MF).
  currentValue: z.number().int().min(0).optional(),
  note: z.string().max(300).optional(),
  status: InvestmentStatusEnum.default('active'),
});

export const UpdateInvestmentSchema = CreateInvestmentSchema.partial();

export type InvestmentKind = z.infer<typeof InvestmentKindEnum>;
export type Compounding = z.infer<typeof CompoundingEnum>;
export type InvestmentStatus = z.infer<typeof InvestmentStatusEnum>;
export type CreateInvestment = z.infer<typeof CreateInvestmentSchema>;
export type UpdateInvestment = z.infer<typeof UpdateInvestmentSchema>;

// --- Computed response shape (CRUD fields + server-derived projection) ---
export interface InvestmentView {
  _id: string;
  name: string;
  kind: InvestmentKind;
  icon: string;
  color: string;
  status: InvestmentStatus;
  startDate: string;
  ratePct?: number;
  tenureMonths?: number;
  compounding?: Compounding;
  principal?: number;
  monthlyAmount?: number;
  currentValue?: number;
  note?: string;
  // Server-managed + derived (all minor units):
  investedAmount: number; // actual contributions logged so far
  totalContribution: number; // planned total over the tenure (basis for return)
  projectedValue: number; // maturity / projected value
  expectedReturn: number; // projectedValue - totalContribution
  maturityDate?: string; // startDate + tenureMonths
}
