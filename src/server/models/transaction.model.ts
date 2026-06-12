import { Schema, model, Document, Types, Model, models } from 'mongoose';

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'investment' | 'reimbursement';
  categoryId: Types.ObjectId;
  subcategoryId?: Types.ObjectId;
  tags: string[];
  date: Date;
  incurredAt?: Date;
  note?: string;
  paymentMethod: string;
  isRecurring: boolean;
  recurringRuleId?: Types.ObjectId;
  goalId?: Types.ObjectId;
  investmentId?: Types.ObjectId;
  attachmentUrl?: string;
  importBatchId?: string;
  clientId?: string;
  hash: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['income', 'expense', 'transfer', 'investment', 'reimbursement'], required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  tags: { type: [String], default: [] },
  date: { type: Date, required: true },
  incurredAt: Date,
  note: String,
  paymentMethod: { type: String, default: 'cash' },
  isRecurring: { type: Boolean, default: false },
  recurringRuleId: { type: Schema.Types.ObjectId, ref: 'RecurringRule' },
  goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
  investmentId: { type: Schema.Types.ObjectId, ref: 'Investment' },
  attachmentUrl: String,
  importBatchId: String,
  clientId: String,
  hash: { type: String },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });
transactionSchema.index({ userId: 1, importBatchId: 1 });
transactionSchema.index({ userId: 1, investmentId: 1 });
transactionSchema.index({ userId: 1, hash: 1 });
// Offline-replay idempotency: at most one tx per (user, clientId). Partial so the
// millions of historical rows without a clientId are exempt from the unique rule.
transactionSchema.index(
  { userId: 1, clientId: 1 },
  { unique: true, partialFilterExpression: { clientId: { $exists: true } } },
);

export const TransactionModel = (models.Transaction as Model<ITransaction>) || model<ITransaction>('Transaction', transactionSchema);
