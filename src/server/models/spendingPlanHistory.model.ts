import { Schema, model, Document, Types, Model, models } from 'mongoose';

// A frozen snapshot of one calendar month's spending plan: the buckets as they
// stood (name/percent/kind) with the target allocated and the actual spent.
// One row per (user, month); upserted live for the current month, then frozen.
export interface ISpendingPlanHistoryBucket {
  id: string;
  name: string;
  color: string;
  kind: 'needs' | 'wants' | 'savings' | 'custom';
  percent: number;
  allocated: number; // minor units — target (percent% of baseIncome)
  spent: number;     // minor units — actual outflow assigned to the bucket
}

export interface ISpendingPlanHistory extends Document {
  userId: Types.ObjectId;
  month: Date; // first instant of the month
  baseIncome: number; // minor units
  currency: string;
  buckets: ISpendingPlanHistoryBucket[];
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const bucketSchema = new Schema<ISpendingPlanHistoryBucket>(
  {
    id:        { type: String, required: true },
    name:      { type: String, required: true },
    color:     { type: String, required: true },
    kind:      { type: String, enum: ['needs', 'wants', 'savings', 'custom'], required: true },
    percent:   { type: Number, required: true },
    allocated: { type: Number, required: true },
    spent:     { type: Number, required: true },
  },
  { _id: false },
);

const spendingPlanHistorySchema = new Schema<ISpendingPlanHistory>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month:      { type: Date, required: true },
    baseIncome: { type: Number, required: true },
    currency:   { type: String, required: true },
    buckets:    { type: [bucketSchema], default: [] },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// One snapshot per (user, month).
spendingPlanHistorySchema.index({ userId: 1, month: 1 }, { unique: true });

export const SpendingPlanHistoryModel =
  (models.SpendingPlanHistory as Model<ISpendingPlanHistory>) ||
  model<ISpendingPlanHistory>('SpendingPlanHistory', spendingPlanHistorySchema);
