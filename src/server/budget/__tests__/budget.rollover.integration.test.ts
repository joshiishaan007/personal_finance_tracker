// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { budgetService } from '../budget.service';
import { transactionService } from '../../transaction/transaction.service';
import { BudgetModel } from '../../models/budget.model';
import { CategoryModel } from '../../models/category.model';

let mem: MongoMemoryServer;
const userId = new Types.ObjectId().toString();
const catOld = new Types.ObjectId().toString();   // budget existed last month, rollover on
const catNew = new Types.ObjectId().toString();   // budget created this month, rollover on
const catOff = new Types.ObjectId().toString();   // existed last month, rollover off

const now = new Date();
const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1);
const beforeLastMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
const midLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15);

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'budget-test' });

  for (const [_id, name] of [[catOld, 'Food'], [catNew, 'Travel'], [catOff, 'Bills']] as const) {
    await CategoryModel.create({ _id, name, icon: '📦', color: '#000', type: 'expense', userId, isDefault: false, schemaVersion: 1 });
  }
  const mk = (categoryId: string, rollover: boolean, startDate: Date) =>
    BudgetModel.create({ userId, categoryId, amount: 10000, period: 'monthly', startDate, rollover, schemaVersion: 1 });
  await mk(catOld, true, beforeLastMonth);
  await mk(catNew, true, firstOfThis);
  await mk(catOff, false, beforeLastMonth);

  // Last month: spend 4000 in catOld and 9000 in catOff.
  await transactionService.create(userId, { amount: 4000, type: 'expense', categoryId: catOld, tags: [], date: midLastMonth.toISOString(), paymentMethod: 'cash', isRecurring: false });
  await transactionService.create(userId, { amount: 9000, type: 'expense', categoryId: catOff, tags: [], date: midLastMonth.toISOString(), paymentMethod: 'cash', isRecurring: false });
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('budget rollover (computed on read)', () => {
  it('carries last month’s unspent for an eligible rollover budget', async () => {
    const list = await budgetService.list(userId);
    const byCat = (id: string) => list.find((b) => String((b.categoryId as { _id?: unknown })?._id ?? b.categoryId) === id)!;

    expect(byCat(catOld).rolloverBalance).toBe(6000);    // 10000 - 4000
  });

  it('does not carry for a budget created this month', async () => {
    const list = await budgetService.list(userId);
    const b = list.find((x) => String((x.categoryId as { _id?: unknown })?._id) === catNew)!;
    expect(b.rolloverBalance).toBe(0);
  });

  it('does not carry when rollover is disabled', async () => {
    const list = await budgetService.list(userId);
    const b = list.find((x) => String((x.categoryId as { _id?: unknown })?._id) === catOff)!;
    expect(b.rolloverBalance).toBe(0);
  });
});
