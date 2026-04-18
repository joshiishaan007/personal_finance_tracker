import { Schema, model, Document, Types } from 'mongoose';

export interface INetWorthSnapshot extends Document {
  userId: Types.ObjectId;
  date: Date;
  assets: {
    cash: number;
    bank: number;
    property: number;
    vehicles: number;
    other: number;
  };
  liabilities: {
    loans: number;
    credit: number;
    other: number;
  };
  netWorth: number;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const netWorthSchema = new Schema<INetWorthSnapshot>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  assets: {
    cash: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    property: { type: Number, default: 0 },
    vehicles: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  liabilities: {
    loans: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  netWorth: { type: Number, required: true },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

netWorthSchema.index({ userId: 1, date: -1 });

export const NetWorthSnapshotModel = model<INetWorthSnapshot>('NetWorthSnapshot', netWorthSchema);
