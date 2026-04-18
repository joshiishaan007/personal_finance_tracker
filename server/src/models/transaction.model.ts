import { Schema, model, Document, Types } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'investment';
  categoryId: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
  tags: string[];
  date: Date;
  note?: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurringRuleId?: Types.ObjectId;
  goalId?: Types.ObjectId;
  attachmentUrl?: string;
  importBatchId?: string;
  hash: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense', 'transfer', 'investment'], required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  tags: { type: [String], default: [] },
  date: { type: Date, required: true },
  note: String,
  paymentMethod: { type: String, default: 'cash' },
  isRecurring: { type: Boolean, default: false },
  recurringRuleId: { type: Schema.Types.ObjectId, ref: 'RecurringRule' },
  goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
  attachmentUrl: String,
  importBatchId: String,
  hash: { type: String },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, importBatchId: 1 });
transactionSchema.index({ userId: 1, hash: 1 });

export const TransactionModel = model<ITransaction>('Transaction', transactionSchema);
