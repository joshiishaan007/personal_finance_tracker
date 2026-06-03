import { budgetRepository as repo } from './budget.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateBudget, UpdateBudget } from '@/shared';

export const budgetService = {
  list: (userId: string) => repo.list(userId),

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
