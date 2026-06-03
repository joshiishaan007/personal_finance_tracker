import { goalRepository as repo } from './goal.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateGoal, UpdateGoal } from '@/shared';

export const goalService = {
  list: (userId: string) => repo.list(userId),

  create: (userId: string, data: CreateGoal) =>
    repo.create({
      ...data,
      userId,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    }),

  async update(userId: string, id: string, data: UpdateGoal): Promise<Result<unknown, 'not_found'>> {
    const set = { ...data, ...(data.deadline && { deadline: new Date(data.deadline) }) };
    const goal = await repo.update(userId, id, set);
    return goal ? Ok(goal) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const goal = await repo.remove(userId, id);
    return goal ? Ok({ deleted: true }) : Err('not_found');
  },
};
