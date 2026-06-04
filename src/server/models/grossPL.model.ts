import { Schema, model, Document, Types, Model, models } from 'mongoose';

export interface IGrossPLEntry extends Document {
  userId: Types.ObjectId;
  month: Date; // first instant of the month
  amount: number; // signed minor units (profit > 0, loss < 0)
  note?: string;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const grossPLSchema = new Schema<IGrossPLEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Date, required: true },
    amount: { type: Number, required: true },
    note: String,
    schemaVersion: { type: Number, default: 1 },
  },
  { timestamps: true },
);

// One entry per (user, month).
grossPLSchema.index({ userId: 1, month: 1 }, { unique: true });

export const GrossPLEntryModel =
  (models.GrossPLEntry as Model<IGrossPLEntry>) || model<IGrossPLEntry>('GrossPLEntry', grossPLSchema);
