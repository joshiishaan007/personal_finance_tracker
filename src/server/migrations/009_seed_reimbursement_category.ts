import type mongoose from 'mongoose';
import { CategoryModel } from '../models/category.model';

// Default category for money returned to you (friend repaying a debt). Settling a
// "people owe you" entry files the incoming cash here so it stays out of the
// spending-plan base income instead of inflating it as ordinary income.
const migration = {
  version: 9,
  description: 'Seed default Reimbursement category (reimbursement type)',
  async up(_mongoose: typeof mongoose) {
    const exists = await CategoryModel.findOne({ name: 'Reimbursement', isDefault: true }).lean();
    if (exists) return; // idempotent
    await CategoryModel.create({
      name: 'Reimbursement', icon: '↩️', color: '#64748B', type: 'reimbursement',
      isDefault: true, schemaVersion: 1,
    });
  },
};

export default migration;
