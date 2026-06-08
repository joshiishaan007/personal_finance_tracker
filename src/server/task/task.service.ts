import { taskRepository as repo } from './task.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateTask, UpdateTask, TaskFilter } from '@/shared';

export const taskService = {
  list: (userId: string, filter: TaskFilter) =>
    repo.list(userId, {
      goalId:  filter.goalId,
      done:    filter.done !== undefined ? filter.done === 'true' : undefined,
      overdue: filter.scope === 'overdue',
      today:   filter.scope === 'today',
      week:    filter.scope === 'week',
    }),

  create: (userId: string, data: CreateTask) =>
    repo.create({ ...data, userId, dueDate: data.dueDate ? new Date(data.dueDate) : undefined, schemaVersion: 1 }),

  async update(userId: string, id: string, data: UpdateTask): Promise<Result<unknown, 'not_found'>> {
    const set: Record<string, unknown> = { ...data };
    if (data.dueDate) set.dueDate = new Date(data.dueDate);
    // Stamp completion time when toggling done.
    if (data.done !== undefined) set.doneAt = data.done ? new Date() : null;
    const task = await repo.update(userId, id, set);
    return task ? Ok(task) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const task = await repo.remove(userId, id);
    return task ? Ok({ deleted: true }) : Err('not_found');
  },
};
