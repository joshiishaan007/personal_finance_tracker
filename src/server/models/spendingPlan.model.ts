import { Schema, model, Document, Types, Model, models } from 'mongoose';

interface IBucket {
  id: string;
  name: string;
  percent: number;
  color: string;
  kind: 'needs' | 'wants' | 'savings' | 'custom';
}

export interface ISpendingPlan extends Document {
  userId: Types.ObjectId;
  buckets: IBucket[];
  // categoryId -> bucketId map. Mixed (plain object) so arbitrary category keys work.
  assignments: Record<string, string>;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const bucketSchema = new Schema<IBucket>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    percent: { type: Number, required: true },
    color: { type: String, default: '#6366F1' },
    kind: { type: String, enum: ['needs', 'wants', 'savings', 'custom'], default: 'custom' },
  },
  { _id: false },
);

const spendingPlanSchema = new Schema<ISpendingPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    buckets: { type: [bucketSchema], default: [] },
    assignments: { type: Schema.Types.Mixed, default: {} },
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// One plan per user.
spendingPlanSchema.index({ userId: 1 }, { unique: true });

export const SpendingPlanModel =
  (models.SpendingPlan as Model<ISpendingPlan>) || model<ISpendingPlan>('SpendingPlan', spendingPlanSchema);
