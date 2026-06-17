// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { importService } from '../import.service';
import { TransactionModel } from '../../models/transaction.model';
import { CategoryModel } from '../../models/category.model';
import { BudgetModel } from '../../models/budget.model';
import { GoalModel } from '../../models/goal.model';
import type { ImportBackup } from '@/shared';

let mem: MongoMemoryServer;
const userId = new Types.ObjectId().toString();
const oldCatId = new Types.ObjectId().toString();

const backup: ImportBackup = {
  categories: [
    { _id: oldCatId, name: 'Coffee', icon: '☕', color: '#F59E0B', type: 'expense', userId: 'someoneElse' },
  ],
  transactions: [
    { amount: 5000, type: 'expense', categoryId: oldCatId, date: '2026-03-01T00:00:00.000Z', note: 'latte', tags: ['cafe'], paymentMethod: 'upi', isRecurring: false },
    { amount: 5000, type: 'expense', categoryId: oldCatId, date: '2026-03-01T00:00:00.000Z', note: 'latte' }, // in-file dup
  ],
  budgets: [
    { categoryId: oldCatId, amount: 30000, period: 'monthly' },
  ],
  goals: [
    { title: 'Emergency fund', targetAmount: 1_000_000, savedAmount: 250_000 },
  ],
};

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'import-test' });
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('JSON merge-restore', () => {
  it('creates the category, remaps transactions to it, and imports budgets + goals', async () => {
    const r = await importService.restore(userId, backup);
    expect(r).toMatchObject({ categories: 1, transactions: 1, budgets: 1, goals: 1 });
    expect(r.skipped).toBe(1); // the in-file duplicate transaction

    const cat = await CategoryModel.findOne({ userId, name: 'Coffee' }).lean();
    expect(cat).toBeTruthy();

    const txs = await TransactionModel.find({ userId }).lean();
    expect(txs).toHaveLength(1);
    expect(String(txs[0]!.categoryId)).toBe(String(cat!._id)); // remapped, not the old id

    expect(await BudgetModel.countDocuments({ userId })).toBe(1);
    const budget = await BudgetModel.findOne({ userId }).lean();
    expect(String(budget!.categoryId)).toBe(String(cat!._id));

    expect(await GoalModel.countDocuments({ userId, title: 'Emergency fund' })).toBe(1);
  });

  it('is idempotent — re-importing the same backup adds nothing', async () => {
    const r = await importService.restore(userId, backup);
    expect(r).toMatchObject({ categories: 0, transactions: 0, budgets: 0, goals: 0 });
    expect(await TransactionModel.countDocuments({ userId })).toBe(1);
    expect(await CategoryModel.countDocuments({ userId, name: 'Coffee' })).toBe(1);
  });
});
