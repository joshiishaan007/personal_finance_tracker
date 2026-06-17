// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { analyticsService } from '../analytics.service';
import { transactionService } from '../../transaction/transaction.service';

let mem: MongoMemoryServer;
const userId = new Types.ObjectId().toString();
const categoryId = new Types.ObjectId().toString();

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'tags-test' });

  const mk = (amount: number, type: 'expense' | 'income', tags: string[]) =>
    transactionService.create(userId, {
      amount, type, categoryId, tags, date: '2026-04-10T00:00:00.000Z', paymentMethod: 'cash', isRecurring: false,
    });
  await mk(1000, 'expense', ['food', 'cafe']);
  await mk(2000, 'expense', ['food']);
  await mk(5000, 'income', ['salary']); // income excluded
  await mk(500, 'expense', []);          // untagged excluded
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('tag breakdown analytics', () => {
  it('sums expense amount + count per tag, excluding income and untagged', async () => {
    const r = await analyticsService.tags(userId, 2026, 4);
    const byTag = Object.fromEntries(r.tags.map((t) => [t.tag, t]));

    expect(byTag.food).toMatchObject({ total: 3000, count: 2 });
    expect(byTag.cafe).toMatchObject({ total: 1000, count: 1 });
    expect(byTag.salary).toBeUndefined();
    expect(r.totalTagged).toBe(4000);
    // Sorted by total desc → food first.
    expect(r.tags[0]!.tag).toBe('food');
  });

  it('returns nothing for a month with no tagged expenses', async () => {
    const r = await analyticsService.tags(userId, 2026, 1);
    expect(r.tags).toHaveLength(0);
    expect(r.totalTagged).toBe(0);
  });
});

describe('spending heatmap', () => {
  const hUser = new Types.ObjectId().toString();
  const hCat = new Types.ObjectId().toString();
  // Use the real instant (in the past vs the query's `to = new Date()`), so the
  // window includes it; the aggregate groups by UTC day, so key off UTC too.
  const today = new Date();
  const tenDaysAgo = new Date(today.getTime() - 10 * 86_400_000);
  const dayKey = (d: Date) => d.toISOString().split('T')[0]!;

  beforeAll(async () => {
    const mk = (amount: number, type: 'expense' | 'income', date: Date) =>
      transactionService.create(hUser, { amount, type, categoryId: hCat, tags: [], date: date.toISOString(), paymentMethod: 'cash', isRecurring: false });
    await mk(1500, 'expense', today);
    await mk(500, 'expense', today);       // same day → summed to 2000
    await mk(800, 'expense', tenDaysAgo);
    await mk(9999, 'income', today);       // income excluded
  }, 30_000);

  it('sums daily expense, excludes income, and reports peak + total', async () => {
    const r = await analyticsService.spendingHeatmap(hUser);
    const map = new Map(r.days.map((d) => [d.date, d.value]));
    expect(map.get(dayKey(today))).toBe(2000);
    expect(map.get(dayKey(tenDaysAgo))).toBe(800);
    expect(r.peak).toBe(2000);
    expect(r.total).toBe(2800); // income not counted
  });
});
