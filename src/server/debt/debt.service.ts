import { debtRepository as repo } from './debt.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateDebt, UpdateDebt, DebtFilter, DebtView, DebtSummaryItem, DebtListResult, DebtDirection } from '@/shared';

function toView(d: {
  _id: unknown; friendName: string; amount: number; note?: string;
  direction?: DebtDirection; incurredAt?: Date; categoryId?: unknown; paymentMethod?: string;
  sourceTxId?: string; transactionId?: string; status: 'pending' | 'settled'; createdAt: Date;
}): DebtView {
  return {
    _id:           String(d._id),
    friendName:    d.friendName,
    amount:        d.amount,
    note:          d.note,
    direction:     d.direction ?? 'they_owe_me',
    incurredAt:    d.incurredAt?.toISOString(),
    categoryId:    d.categoryId ? String(d.categoryId) : undefined,
    paymentMethod: d.paymentMethod,
    sourceTxId:    d.sourceTxId,
    transactionId: d.transactionId,
    status:        d.status,
    createdAt:     d.createdAt.toISOString(),
  };
}

export const debtService = {
  async list(userId: string, filter: DebtFilter): Promise<DebtListResult> {
    const { items, total } = await repo.list(userId, filter);
    return {
      items:   items.map(toView),
      total,
      hasMore: filter.page * filter.limit < total,
    };
  },

  async summary(userId: string, direction: DebtDirection): Promise<DebtSummaryItem[]> {
    const rows = await repo.summary(userId, direction);
    return rows.map((r) => ({
      // aggregate returns untyped Document — use explicit coercions, not `as`.
      friendName: String(r.displayName ?? ''),
      total:      Number(r.total ?? 0),
      count:      Number(r.count ?? 0),
    }));
  },

  createMany: (userId: string, debts: CreateDebt[]) => repo.createMany(userId, debts),

  async update(userId: string, id: string, data: UpdateDebt): Promise<Result<DebtView, 'not_found'>> {
    const updates: Record<string, unknown> = { ...data };
    if (data.status === 'settled') updates.settledAt = new Date();
    const doc = await repo.update(userId, id, updates);
    return doc ? Ok(toView(doc)) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const doc = await repo.remove(userId, id);
    return doc ? Ok({ deleted: true }) : Err('not_found');
  },

  // Revert any debt linked to a now-deleted settlement transaction back to pending.
  revertByTransaction: (userId: string, transactionId: string) =>
    repo.unlinkSettlementTx(userId, transactionId),

  async cleanupOldSettled(userId: string): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await repo.deleteOldSettled(userId, cutoff);
    return { deleted: result.deletedCount };
  },
};
