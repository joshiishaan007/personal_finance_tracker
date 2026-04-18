import { Schema, model, Document, Types } from 'mongoose';

export interface IBudget extends Document {
  userId: Types.ObjectId;
  categoryId: Types.ObjectId;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: Date;
  rollover: boolean;
  rolloverBalance: number;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  startDate: { type: Date, required: true },
  rollover: { type: Boolean, default: false },
  rolloverBalance: { type: Number, default: 0 },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

budgetSchema.index({ userId: 1 });
budgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

export const BudgetModel = model<IBudget>('Budget', budgetSchema);
