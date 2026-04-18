import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  userId?: Types.ObjectId;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'transfer' | 'investment';
  parentCategoryId?: Types.ObjectId;
  isDefault: boolean;
  monthlyBudget?: number;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  icon: { type: String, default: '📦' },
  color: { type: String, default: '#6B7280' },
  type: { type: String, enum: ['income', 'expense', 'transfer', 'investment'], required: true },
  parentCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  isDefault: { type: Boolean, default: false },
  monthlyBudget: Number,
  schemaVersion: { type: Number, default: 1 },
}, { timestamps: true });

categorySchema.index({ userId: 1 });
categorySchema.index({ isDefault: 1 });

export const CategoryModel = model<ICategory>('Category', categorySchema);
