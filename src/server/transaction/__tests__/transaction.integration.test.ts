// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { transactionService } from '../transaction.service';
import { categoryService } from '../../category/category.service';
import { CategoryModel } from '../../models/category.model';

let mem: MongoMemoryServer;
const userId = new Types.ObjectId().toString();
const categoryId = new Types.ObjectId().toString();

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'personal-finance-tracker' });
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('transaction 4-layer path (real Mongo)', () => {
  it('creates a transaction with a dedup hash and integer minor units', async () => {
    const tx = await transactionService.create(userId, {
      amount: 12345,
      type: 'expense',
      categoryId,
      tags: [],
      date: '2026-01-15T00:00:00.000Z',
      note: 'coffee',
      paymentMethod: 'cash',
      isRecurring: false,
    });
    expect(tx.amount).toBe(12345);
    expect(tx.hash).toHaveLength(64); // sha256 hex
    expect(String(tx.userId)).toBe(userId);
  });

  it('lists only the owner’s transactions, server-paginated', async () => {
    // a different user's transaction must NOT appear
    await transactionService.create(new Types.ObjectId().toString(), {
      amount: 999, type: 'expense', categoryId, tags: [], date: '2026-01-16T00:00:00.000Z',
      paymentMethod: 'cash', isRecurring: false,
    });
    const { items, total } = await transactionService.list(userId, { page: 1, limit: 50 } as never);
    expect(total).toBe(1);
    expect(items).toHaveLength(1);
    expect(items.every((i) => String(i.userId) === userId)).toBe(true);
  });

  it('returns a not_found Result when updating someone else’s id', async () => {
    const r = await transactionService.update(userId, new Types.ObjectId().toString(), { note: 'x' });
    expect(r.state).toBe('error');
    if (r.state === 'error') expect(r.reason).toBe('not_found');
  });

  it('CSV import dedups by hash (idempotent re-import)', async () => {
    const rows = [
      { d: '2026-02-01', a: '10.00', n: 'lunch' },
      { d: '2026-02-01', a: '10.00', n: 'lunch' }, // exact dup in-batch
    ];
    const mapping = { dateColumn: 'd', amountColumn: 'a', noteColumn: 'n', defaultType: 'expense', defaultCategoryId: categoryId };
    const first = await transactionService.commitImport(userId, rows, mapping);
    expect(first.imported).toBe(1);
    expect(first.skipped).toBe(1);
    // re-importing the same row is a no-op (existing-doc dedup)
    const second = await transactionService.commitImport(userId, [rows[0]], mapping);
    expect(second.imported).toBe(0);
  });
});

describe('category defaults are readable without a userId (global rows)', () => {
  it('exposes isDefault categories to a user', async () => {
    await CategoryModel.create({ name: 'Seeded', icon: '🍔', color: '#F59E0B', type: 'expense', isDefault: true, schemaVersion: 1 });
    const cats = await categoryService.list(userId);
    expect(cats.some((c) => (c as { isDefault?: boolean }).isDefault)).toBe(true);
  });
});
