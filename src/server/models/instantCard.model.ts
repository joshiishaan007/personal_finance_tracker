import { Schema, model, Document, Types, Model, models } from 'mongoose';

export interface IInstantCard extends Document {
  userId: Types.ObjectId;
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'investment';
  categoryId: string;
  paymentMethod: string;
  note?: string;
  tags: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const instantCardSchema = new Schema<IInstantCard>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount:        { type: Number, required: true },
    type:          { type: String, enum: ['income', 'expense', 'transfer', 'investment'], required: true },
    categoryId:    { type: String, required: true },
    paymentMethod: { type: String, default: 'cash' },
    note:          String,
    tags:          [String],
    sortOrder:     { type: Number, default: 0 },
  },
  { timestamps: true },
);

instantCardSchema.index({ userId: 1, sortOrder: 1 });

export const InstantCardModel =
  (models.InstantCard as Model<IInstantCard>) || model<IInstantCard>('InstantCard', instantCardSchema);
