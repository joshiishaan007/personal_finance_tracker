import { Schema, model, Document, Types, Model, models } from 'mongoose';

export interface IInvestment extends Document {
  userId: Types.ObjectId;
  name: string;
  kind: 'fd' | 'rd' | 'sip' | 'equity' | 'ppf';
  icon: string;
  color: string;
  status: 'active' | 'matured' | 'closed';
  startDate: Date;
  ratePct?: number;
  tenureMonths?: number;
  tenureDays?: number;
  compounding?: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
  principal?: number;
  monthlyAmount?: number;
  currentValue?: number;
  note?: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const investmentSchema = new Schema<IInvestment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    kind: { type: String, enum: ['fd', 'rd', 'sip', 'equity', 'ppf'], required: true },
    icon: { type: String, default: '💹' },
    color: { type: String, default: '#6366F1' },
    status: { type: String, enum: ['active', 'matured', 'closed'], default: 'active' },
    startDate: { type: Date, required: true },
    ratePct: Number,
    tenureMonths: Number,
    tenureDays: Number,
    compounding: { type: String, enum: ['monthly', 'quarterly', 'halfyearly', 'yearly'] },
    principal: Number,
    monthlyAmount: Number,
    currentValue: Number,
    note: String,
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

investmentSchema.index({ userId: 1, status: 1 });

export const InvestmentModel =
  (models.Investment as Model<IInvestment>) || model<IInvestment>('Investment', investmentSchema);
