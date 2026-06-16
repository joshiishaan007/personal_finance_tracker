import { Schema, model, Document, Types, Model, models } from 'mongoose';
import type { LoanKind, LoanStatus } from '@/shared';

export interface ILoanPayment {
  _id: Types.ObjectId;
  date: Date;
  amount: number;
  transactionId?: string;
}

export interface ILoan extends Document {
  userId: Types.ObjectId;
  name: string;
  lender?: string;
  kind: LoanKind;
  principal: number;
  interestRatePct?: number;
  emiAmount: number;
  tenureMonths: number;
  startDate: Date;
  status: LoanStatus;
  note?: string;
  payments: ILoanPayment[];
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<ILoanPayment>({
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  transactionId: String,
});

const loanSchema = new Schema<ILoan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    lender: String,
    kind: { type: String, enum: ['home', 'car', 'personal', 'education', 'gold', 'business', 'credit-card', 'other'], default: 'personal' },
    principal: { type: Number, required: true },
    interestRatePct: Number,
    emiAmount: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    startDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    note: String,
    payments: { type: [paymentSchema], default: [] },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

loanSchema.index({ userId: 1, status: 1 });
loanSchema.index({ userId: 1, 'payments.transactionId': 1 });

export const LoanModel = (models.Loan as Model<ILoan>) || model<ILoan>('Loan', loanSchema);
