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
