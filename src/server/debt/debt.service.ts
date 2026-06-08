import { debtRepository as repo } from './debt.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateDebt, UpdateDebt, DebtFilter, DebtView, DebtSummaryItem } from '@/shared';

export const debtService = {
  async list(userId: string, filter: DebtFilter): Promise<DebtView[]> {
    const rows = await repo.list(userId, filter);
    return rows.map((d) => ({
      _id:           String(d._id),
      friendName:    d.friendName,
      amount:        d.amount,
      note:          d.note,
      transactionId: d.transactionId,
      status:        d.status,
      createdAt:     d.createdAt.toISOString(),
    }));
  },

  async summary(userId: string): Promise<DebtSummaryItem[]> {
    const rows = await repo.summary(userId);
    return rows.map((r) => ({
      friendName: r.displayName as string,
      total:      r.total as number,
      count:      r.count as number,
    }));
  },

  createMany: (userId: string, debts: CreateDebt[]) => repo.createMany(userId, debts),

  async update(userId: string, id: string, data: UpdateDebt): Promise<Result<unknown, 'not_found'>> {
    const updates: Record<string, unknown> = { ...data };
    if (data.status === 'settled') updates.settledAt = new Date();
    const doc = await repo.update(userId, id, updates);
    return doc ? Ok(doc) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const doc = await repo.remove(userId, id);
    return doc ? Ok({ deleted: true }) : Err('not_found');
  },
};
