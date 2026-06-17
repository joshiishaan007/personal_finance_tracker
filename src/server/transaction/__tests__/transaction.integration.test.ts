// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { transactionService } from '../transaction.service';
import { categoryService } from '../../category/category.service';
import { CategoryModel } from '../../models/category.model';
import { TransactionModel } from '../../models/transaction.model';

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

describe('frequent templates (one-tap repeat chips)', () => {
  const freqUser = new Types.ObjectId().toString();
  const freqCatId = new Types.ObjectId().toString();

  beforeAll(async () => {
    await CategoryModel.create({ _id: freqCatId, name: 'Coffee', icon: '☕', color: '#F59E0B', type: 'expense', userId: freqUser, isDefault: false, schemaVersion: 1 });
    // Same {category, amount, paymentMethod} repeated across different days (distinct
    // dedup hashes); recent dates so they fall inside the 60-day window.
    const make = (amount: number, paymentMethod: string, day: string) =>
      transactionService.create(freqUser, {
        amount, type: 'expense', categoryId: freqCatId, tags: [],
        date: `2026-0${day}T00:00:00.000Z`, paymentMethod: paymentMethod as never, isRecurring: false,
      });
    await make(5000, 'upi', '6-01'); await make(5000, 'upi', '5-30'); await make(5000, 'upi', '5-28');
    await make(4000, 'card', '6-02'); await make(4000, 'card', '5-29');
    await make(999, 'cash', '6-01'); // single occurrence — must be excluded (count < 2)
  }, 30_000);

  it('returns only combos seen ≥2 times, most-frequent first, in minor units', async () => {
    const rows = await transactionService.frequent(freqUser);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ amount: 5000, paymentMethod: 'upi', count: 3, categoryName: 'Coffee', categoryIcon: '☕' });
    expect(rows[1]).toMatchObject({ amount: 4000, paymentMethod: 'card', count: 2 });
    expect(rows.some((r) => r.amount === 999)).toBe(false);
  });

  it('does not leak another user’s templates', async () => {
    const rows = await transactionService.frequent(new Types.ObjectId().toString());
    expect(rows).toHaveLength(0);
  });
});

describe('clientId idempotency (offline replay safety)', () => {
  it('upserts on clientId — replaying the same queued create yields one row', async () => {
    const uid = new Types.ObjectId().toString();
    const payload = {
      amount: 4200, type: 'expense' as const, categoryId, tags: [],
      date: '2026-06-01T00:00:00.000Z', note: 'metro', paymentMethod: 'upi' as const,
      isRecurring: false, clientId: 'offline-key-1',
    };
    const a = await transactionService.create(uid, payload);
    const b = await transactionService.create(uid, payload); // replay
    expect(String(a._id)).toBe(String(b._id));
    expect(await TransactionModel.countDocuments({ userId: uid, clientId: 'offline-key-1' })).toBe(1);
  });

  it('without a clientId, two identical entries stay distinct (no false dedup)', async () => {
    const uid = new Types.ObjectId().toString();
    const base = {
      amount: 7777, type: 'expense' as const, categoryId, tags: [],
      date: '2026-06-02T00:00:00.000Z', note: 'coffee', paymentMethod: 'cash' as const, isRecurring: false,
    };
    await transactionService.create(uid, base);
    await transactionService.create(uid, base);
    expect(await TransactionModel.countDocuments({ userId: uid, note: 'coffee' })).toBe(2);
  });
});

describe('soft delete / Trash', () => {
  const uid = new Types.ObjectId().toString();
  const cat = new Types.ObjectId().toString();

  async function makeOne() {
    return transactionService.create(uid, {
      amount: 5000, type: 'expense', categoryId: cat, tags: [],
      date: '2026-07-10T00:00:00.000Z', note: 'gym', paymentMethod: 'cash', isRecurring: false,
    });
  }

  // Raw aggregate proves the pre('aggregate') middleware injects the deletedAt filter.
  const aggCount = async () => {
    const rows = await TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(uid) } },
      { $count: 'n' },
    ]);
    return (rows[0]?.n as number) ?? 0;
  };

  it('soft-delete hides the row from lists, counts and aggregates, but keeps it in Trash', async () => {
    const tx = await makeOne();
    const id = String(tx._id);

    expect((await transactionService.list(uid, { page: 1, limit: 50 } as never)).total).toBe(1);
    expect(await aggCount()).toBe(1);

    const r = await transactionService.remove(uid, id);
    expect(r.state).toBe('ok');

    // gone from every live read (find + countDocuments + aggregate)…
    expect((await transactionService.list(uid, { page: 1, limit: 50 } as never)).total).toBe(0);
    expect(await aggCount()).toBe(0);
    // …but recoverable from Trash
    const trash = await transactionService.listTrash(uid);
    expect(trash).toHaveLength(1);
    expect(String(trash[0]!._id)).toBe(id);
    expect(trash[0]!.deletedAt).toBeInstanceOf(Date);
  });

  it('restore returns the row to live reads and empties it from Trash', async () => {
    const id = String((await transactionService.listTrash(uid))[0]!._id);
    const r = await transactionService.restore(uid, id);
    expect(r.state).toBe('ok');
    expect((await transactionService.list(uid, { page: 1, limit: 50 } as never)).total).toBe(1);
    expect(await transactionService.listTrash(uid)).toHaveLength(0);
  });

  it('emptyTrash permanently removes trashed rows only', async () => {
    const tx = await makeOne(); // a second live row
    await transactionService.remove(uid, String(tx._id)); // trash it
    expect(await transactionService.listTrash(uid)).toHaveLength(1);

    const { deleted } = await transactionService.emptyTrash(uid);
    expect(deleted).toBe(1);
    expect(await transactionService.listTrash(uid)).toHaveLength(0);
    // the earlier restored row is untouched
    expect((await transactionService.list(uid, { page: 1, limit: 50 } as never)).total).toBe(1);
  });
});

describe('category defaults are readable without a userId (global rows)', () => {
  it('exposes isDefault categories to a user', async () => {
    await CategoryModel.create({ name: 'Seeded', icon: '🍔', color: '#F59E0B', type: 'expense', isDefault: true, schemaVersion: 1 });
    const cats = await categoryService.list(userId);
    expect(cats.some((c) => (c as { isDefault?: boolean }).isDefault)).toBe(true);
  });
});
