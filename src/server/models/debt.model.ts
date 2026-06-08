import { Schema, model, Document, Types, Model, models } from 'mongoose';

export interface IDebt extends Document {
  userId:        Types.ObjectId;
  friendName:    string;
  amount:        number;
  note?:         string;
  sourceTxId?:    string;
  transactionId?: string;
  status:        'pending' | 'settled';
  settledAt?:    Date;
  createdAt:     Date;
  updatedAt:     Date;
}

const debtSchema = new Schema<IDebt>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    friendName:    { type: String, required: true, trim: true },
    amount:        { type: Number, required: true },
    note:          String,
    sourceTxId:    String,
    transactionId: String,
    status:        { type: String, enum: ['pending', 'settled'], default: 'pending' },
    settledAt:     Date,
  },
  { timestamps: true },
);

debtSchema.index({ userId: 1, status: 1 });
debtSchema.index({ userId: 1, friendName: 1 });
debtSchema.index({ userId: 1, sourceTxId: 1 });

export const DebtModel =
  (models.Debt as Model<IDebt>) || model<IDebt>('Debt', debtSchema);
