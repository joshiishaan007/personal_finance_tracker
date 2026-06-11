// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spendingPlanService } from '../spendingPlan.service';
import { transactionService } from '../../transaction/transaction.service';
import { SpendingPlanHistoryModel } from '../../models/spendingPlanHistory.model';

let mem: MongoMemoryServer;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'personal-finance-tracker' });
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

describe('spending-plan monthly history', () => {
  it('upserts exactly one frozen snapshot for the current month (idempotent)', async () => {
    const userId = new Types.ObjectId().toString();
    const categoryId = new Types.ObjectId().toString();
    await transactionService.create(userId, {
      amount: 3_000_000, type: 'income', categoryId, tags: [],
      date: new Date().toISOString(), paymentMethod: 'upi', isRecurring: false,
    });

    await spendingPlanService.view(userId);
    await spendingPlanService.view(userId); // second load must not duplicate

    const rows = await SpendingPlanHistoryModel.find({ userId: new Types.ObjectId(userId) });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.month).toEqual(monthStart(new Date()));
    expect(rows[0]!.baseIncome).toBe(3_000_000);
  });

  it('does not snapshot a month with no income or spend', async () => {
    const userId = new Types.ObjectId().toString();
    await spendingPlanService.view(userId);
    expect(await SpendingPlanHistoryModel.countDocuments({ userId: new Types.ObjectId(userId) })).toBe(0);
  });

  it('history() returns completed months only, excluding the in-progress month', async () => {
    const userId = new Types.ObjectId().toString();
    const prevMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

    // A frozen snapshot for last month + a current-month row written by view().
    await SpendingPlanHistoryModel.create({
      userId: new Types.ObjectId(userId), month: prevMonth, baseIncome: 2_000_000, currency: 'INR',
      buckets: [{ id: 'needs', name: 'Needs', color: '#0EA5E9', kind: 'needs', percent: 50, allocated: 1_000_000, spent: 800_000 }],
      schemaVersion: 1,
    });
    await transactionService.create(userId, {
      amount: 1_000_000, type: 'income', categoryId: new Types.ObjectId().toString(), tags: [],
      date: new Date().toISOString(), paymentMethod: 'upi', isRecurring: false,
    });
    await spendingPlanService.view(userId); // writes current month

    const history = await spendingPlanService.history(userId);
    expect(history).toHaveLength(1);
    expect(history[0]!.baseIncome).toBe(2_000_000);
    expect(history[0]!.buckets[0]).toMatchObject({ name: 'Needs', allocated: 1_000_000, spent: 800_000 });
  });
});
