import { Schema, model, Document, Types, Model, models, Query, Aggregate } from 'mongoose';

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
  // Set when soft-deleted (moved to Trash). A TTL index purges the row 30 days
  // later, so there is no cron — MongoDB itself does the cleanup.
  deletedAt?: Date;
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
  deletedAt: Date,
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
// Trash auto-purge: MongoDB deletes a soft-deleted row 30 days after deletedAt.
// Partial filter keeps live rows (no deletedAt) out of the TTL index entirely.
transactionSchema.index(
  { deletedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { deletedAt: { $exists: true } } },
);

// Soft-delete is invisible everywhere by default. A query that explicitly mentions
// `deletedAt` (the Trash list / restore / purge) opts out and sees deleted rows.
function excludeSoftDeleted(this: Query<unknown, ITransaction>) {
  if ('deletedAt' in this.getFilter()) return;
  this.where({ deletedAt: { $exists: false } });
}
transactionSchema.pre(['find', 'findOne', 'findOneAndUpdate', 'countDocuments'], excludeSoftDeleted);
transactionSchema.pre('aggregate', function (this: Aggregate<unknown[]>) {
  this.pipeline().unshift({ $match: { deletedAt: { $exists: false } } });
});

export const TransactionModel = (models.Transaction as Model<ITransaction>) || model<ITransaction>('Transaction', transactionSchema);
