// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { debtService } from '../debt.service';
import { debtRepository } from '../debt.repository';
import { transactionService } from '../../transaction/transaction.service';
import { DebtModel } from '../../models/debt.model';

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

describe('debt direction (lending vs borrowing)', () => {
  it('summary is scoped per direction', async () => {
    await debtService.createMany(userId, [
      { friendName: 'Alice', amount: 5000, direction: 'they_owe_me' },
      { friendName: 'Alice', amount: 2000, direction: 'they_owe_me' },
      { friendName: 'Bob',   amount: 8000, direction: 'i_owe_them', categoryId, incurredAt: '2026-06-01T00:00:00.000Z' },
    ] as never);

    const lent = await debtService.summary(userId, 'they_owe_me');
    expect(lent).toHaveLength(1);
    expect(lent[0]).toMatchObject({ friendName: 'Alice', total: 7000, count: 2 });

    const borrowed = await debtService.summary(userId, 'i_owe_them');
    expect(borrowed).toHaveLength(1);
    expect(borrowed[0]).toMatchObject({ friendName: 'Bob', total: 8000, count: 1 });
  });

  it('list filters by direction and carries the new fields into the view', async () => {
    const { items } = await debtService.list(userId, {
      status: 'pending', direction: 'i_owe_them', page: 1, limit: 20,
    } as never);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ friendName: 'Bob', direction: 'i_owe_them', categoryId });
    expect(items[0]!.incurredAt).toBe('2026-06-01T00:00:00.000Z');
  });

  it('legacy rows without a direction default to they_owe_me in the view', async () => {
    const legacyUser = new Types.ObjectId().toString();
    await DebtModel.collection.insertOne({
      userId: new Types.ObjectId(legacyUser), friendName: 'Carol', amount: 100,
      status: 'pending', createdAt: new Date(), updatedAt: new Date(),
    });
    const { items } = await debtService.list(legacyUser, { status: 'all', direction: 'all', page: 1, limit: 20 } as never);
    expect(items[0]!.direction).toBe('they_owe_me');
  });
});

describe('settlement-link reversibility', () => {
  it('deleting the settlement transaction reverts its linked debt to pending', async () => {
    const uid = new Types.ObjectId().toString();
    // A borrow entry the user marked done: an expense tx was created and linked.
    const tx = await transactionService.create(uid, {
      amount: 8000, type: 'expense', categoryId, tags: [],
      date: '2026-06-07T00:00:00.000Z', incurredAt: '2026-06-01T00:00:00.000Z',
      note: 'Repaid Bob', paymentMethod: 'upi', isRecurring: false,
    });
    const [debt] = await debtService.createMany(uid, [
      { friendName: 'Bob', amount: 8000, direction: 'i_owe_them', categoryId },
    ] as never);
    await debtService.update(uid, String(debt._id), { status: 'settled', transactionId: String(tx._id) });

    // Deleting the tx from the feed cascades to revert the debt.
    const r = await transactionService.remove(uid, String(tx._id));
    expect(r.state).toBe('ok');

    const reverted = await debtRepository.findOne(uid, String(debt._id));
    expect(reverted!.status).toBe('pending');
    expect(reverted!.transactionId).toBeUndefined();
  });

  it('unlinkSettlementTx is tenant-scoped (does not touch another user’s debt)', async () => {
    const owner = new Types.ObjectId().toString();
    const other = new Types.ObjectId().toString();
    const sharedTxId = new Types.ObjectId().toString();
    const [d] = await debtService.createMany(owner, [
      { friendName: 'Dave', amount: 500, direction: 'i_owe_them' },
    ] as never);
    await debtService.update(owner, String(d._id), { status: 'settled', transactionId: sharedTxId });

    // A different user removing a tx with the same id must not revert the owner's debt.
    await debtService.revertByTransaction(other, sharedTxId);
    const untouched = await debtRepository.findOne(owner, String(d._id));
    expect(untouched!.status).toBe('settled');
  });
});
