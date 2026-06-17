import { budgetRepository as repo } from './budget.repository';
import { transactionRepository as txRepo } from '../transaction/transaction.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateBudget, UpdateBudget } from '@/shared';

export const budgetService = {
  // Rollover is computed on read (no cron): a monthly budget that existed last
  // month carries forward whatever it left unspent — max(0, limit - lastSpend).
  // The startDate guard means a budget created this month carries nothing (so a
  // fresh budget isn't credited a full extra month). `rolloverBalance` in the
  // response is this live carry, not a stored counter.
  async list(userId: string) {
    const budgets = await repo.list(userId);
    const now = new Date();
    const firstOfThis = new Date(now.getFullYear(), now.getMonth(), 1);
    const eligible = (b: (typeof budgets)[number]) =>
      b.rollover && b.period === 'monthly' && new Date(b.startDate) < firstOfThis;
    if (!budgets.some(eligible)) return budgets;

    const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const prevSpend = await txRepo.spendByCategoryPeriod(userId, prevFrom, prevTo);

    return budgets.map((b) => {
      if (!eligible(b)) return b;
      const cat = b.categoryId as unknown;
      const catId = String((cat as { _id?: unknown })?._id ?? cat);
      return { ...b, rolloverBalance: Math.max(0, b.amount - (prevSpend.get(catId) ?? 0)) };
    });
  },

  create: (userId: string, data: CreateBudget) =>
    repo.upsert(userId, data.categoryId, { ...data, userId, startDate: new Date(data.startDate) }),

  async update(userId: string, id: string, data: UpdateBudget): Promise<Result<unknown, 'not_found'>> {
    const budget = await repo.update(userId, id, data as Record<string, unknown>);
    return budget ? Ok(budget) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ success: true }, 'not_found'>> {
    await repo.remove(userId, id);
    return Ok({ success: true });
  },
};
