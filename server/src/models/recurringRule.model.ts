import { Schema, model, Document, Types } from 'mongoose';

export interface IRecurringRule extends Document {
  userId: Types.ObjectId;
  templateTransaction: {
    amount: number;
    type: string;
    categoryId: Types.ObjectId;
    tags: string[];
    note?: string;
    paymentMethod: string;
    goalId?: Types.ObjectId;
  };
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number;
  dayOfWeek?: number;
  nextDueDate: Date;
  lastGeneratedDate?: Date;
  autoPost: boolean;
  isActive: boolean;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const recurringRuleSchema = new Schema<IRecurringRule>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  templateTransaction: {
    amount: { type: Number, required: true },
    type: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: { type: [String], default: [] },
    note: String,
    paymentMethod: { type: String, default: 'cash' },
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
  },
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  dayOfMonth: Number,
  dayOfWeek: Number,
  nextDueDate: { type: Date, required: true },
  lastGeneratedDate: Date,
  autoPost: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

export const RecurringRuleModel = model<IRecurringRule>('RecurringRule', recurringRuleSchema);
