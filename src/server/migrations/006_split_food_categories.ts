import type mongoose from 'mongoose';
import { CategoryModel } from '../models/category.model';

// "Food & Dining" is too broad for a spending plan: daily food is a Need but a
// restaurant meal is a Want. Add the granular pair as defaults so users can
// assign them to different buckets. The original "Food & Dining" category is
// kept (existing transactions reference it) — users can re-tag new transactions
// to the granular categories going forward.
const NEW_CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#22C55E', type: 'expense' },
  { name: 'Dining Out', icon: '🍽️', color: '#F59E0B', type: 'expense' },
] as const;

const migration = {
  version: 6,
  description: 'Add Food and Dining Out as granular default categories for spending-plan bucket assignment',
  async up(_mongoose: typeof mongoose) {
    for (const cat of NEW_CATEGORIES) {
      const exists = await CategoryModel.findOne({ name: cat.name, isDefault: true }).lean();
      if (exists) continue;
      await CategoryModel.create({ ...cat, isDefault: true, schemaVersion: 1 });
    }
  },
};

export default migration;
