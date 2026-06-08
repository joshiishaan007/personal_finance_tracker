import { contributionRepository as repo } from './contribution.repository';
import { lifeGoalRepository } from '../lifeGoal/lifeGoal.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateContribution } from '@/shared';

export const contributionService = {
  listByGoal: (userId: string, goalId: string) => repo.listByGoal(userId, goalId),

  heatmap: (userId: string, from: Date, to: Date, goalId?: string) =>
    repo.heatmap(userId, from, to, goalId),

  async create(userId: string, data: CreateContribution) {
    const value = data.value ?? 1;
    const contribution = await repo.create({
      userId,
      goalId: data.goalId,
      date: data.date ? new Date(data.date) : new Date(),
      value,
      note: data.note,
      schemaVersion: 1,
    });
    // Reflect the logged progress on the parent goal (atomic $inc).
    await lifeGoalRepository.incCurrentValue(userId, data.goalId, value);
    return contribution;
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const existing = await repo.findById(userId, id);
    if (!existing) return Err('not_found');
    await repo.remove(userId, id);
    await lifeGoalRepository.incCurrentValue(userId, String(existing.goalId), -(existing.value ?? 0));
    return Ok({ deleted: true });
  },
};
