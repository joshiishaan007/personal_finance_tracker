import type mongoose from 'mongoose';
import { CategoryModel } from '../models/category.model';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', color: '#F59E0B', type: 'expense' },
  { name: 'Transport', icon: '🚗', color: '#3B82F6', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', color: '#EC4899', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', color: '#8B5CF6', type: 'expense' },
  { name: 'Health', icon: '💊', color: '#EF4444', type: 'expense' },
  { name: 'Utilities', icon: '💡', color: '#F97316', type: 'expense' },
  { name: 'Rent', icon: '🏠', color: '#6366F1', type: 'expense' },
  { name: 'Education', icon: '📚', color: '#0EA5E9', type: 'expense' },
  { name: 'Travel', icon: '✈️', color: '#06B6D4', type: 'expense' },
  { name: 'Personal Care', icon: '💆', color: '#F472B6', type: 'expense' },
  { name: 'Other Expense', icon: '📦', color: '#6B7280', type: 'expense' },
  { name: 'Salary', icon: '💼', color: '#10B981', type: 'income' },
  { name: 'Freelance', icon: '💻', color: '#34D399', type: 'income' },
  { name: 'Business', icon: '🏢', color: '#059669', type: 'income' },
  { name: 'Investment Returns', icon: '📈', color: '#6366F1', type: 'income' },
  { name: 'Other Income', icon: '💰', color: '#6B7280', type: 'income' },
  { name: 'Mutual Funds', icon: '📊', color: '#6366F1', type: 'investment' },
  { name: 'Stocks', icon: '📈', color: '#10B981', type: 'investment' },
  { name: 'PPF / EPF', icon: '🏦', color: '#F59E0B', type: 'investment' },
  { name: 'Other Investment', icon: '💹', color: '#6B7280', type: 'investment' },
] as const;

const migration = {
  version: 1,
  description: 'Seed global default categories',
  async up(_mongoose: typeof mongoose) {
    const existing = await CategoryModel.countDocuments({ isDefault: true });
    if (existing > 0) return; // idempotent
    await CategoryModel.insertMany(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, isDefault: true, schemaVersion: 1 })),
    );
  },
};

export default migration;
