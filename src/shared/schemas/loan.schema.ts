import { z } from 'zod';
import { moneyMinor } from './money';

export const LoanKindEnum = z.enum([
  'home', 'car', 'personal', 'education', 'gold', 'business', 'credit-card', 'other',
]);
export const LoanStatusEnum = z.enum(['active', 'closed']);

export const CreateLoanSchema = z.object({
  name: z.string().min(1).max(80),
  lender: z.string().max(80).optional(),
  kind: LoanKindEnum.default('personal'),
  principal: moneyMinor,
  // Annual interest rate.
  interestRatePct: z.number().min(0).max(100).optional(),
  // Monthly instalment in minor units.
  emiAmount: moneyMinor,
  tenureMonths: z.number().int().min(1).max(1200),
  startDate: z.string().datetime(),
  note: z.string().max(300).optional(),
  status: LoanStatusEnum.default('active'),
});

export const UpdateLoanSchema = CreateLoanSchema.partial();

// Recording a paid EMI. transactionId links the auto-created expense so deleting
// it reverts the payment.
export const AddLoanPaymentSchema = z.object({
  amount: moneyMinor,
  date: z.string().datetime().optional(),
  transactionId: z.string().optional(),
});

export type LoanKind = z.infer<typeof LoanKindEnum>;
export type LoanStatus = z.infer<typeof LoanStatusEnum>;
export type CreateLoan = z.infer<typeof CreateLoanSchema>;
export type UpdateLoan = z.infer<typeof UpdateLoanSchema>;
export type AddLoanPayment = z.infer<typeof AddLoanPaymentSchema>;

export interface LoanPaymentView {
  _id: string;
  date: string;
  amount: number;
  transactionId?: string;
}

export interface LoanView {
  _id: string;
  name: string;
  lender?: string;
  kind: LoanKind;
  principal: number;
  interestRatePct?: number;
  emiAmount: number;
  tenureMonths: number;
  startDate: string;
  status: LoanStatus;
  note?: string;
  payments: LoanPaymentView[];
  // Derived (all minor units / counts):
  paidCount: number;
  paidAmount: number;
  totalPayable: number;
  outstanding: number;
  progressPct: number;
  nextDueDate?: string;
}
