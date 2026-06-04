import { TaskModel } from '../models/task.model';

// Typed filter — Mongoose predicates ($lt, etc.) never leave this file.
interface TaskListFilter {
  goalId?: string;
  done?: boolean;
  overdue?: boolean; // done=false AND dueDate < now
}

export const taskRepository = {
  list: (userId: string, filter: TaskListFilter) => {
    const q: Record<string, unknown> = {};
    if (filter.goalId !== undefined) q.goalId = filter.goalId;
    if (filter.overdue) { q.done = false; q.dueDate = { $lt: new Date() }; }
    else if (filter.done !== undefined) q.done = filter.done;
    return TaskModel.find({ userId, ...q }).sort({ done: 1, dueDate: 1, order: 1, createdAt: -1 }).lean();
  },

  create: (doc: Record<string, unknown>) => TaskModel.create(doc),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    TaskModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  remove: (userId: string, id: string) => TaskModel.findOneAndDelete({ _id: id, userId }).lean(),

  count: (userId: string, filter: TaskListFilter) => {
    const q: Record<string, unknown> = {};
    if (filter.overdue) { q.done = false; q.dueDate = { $lt: new Date() }; }
    else if (filter.done !== undefined) q.done = filter.done;
    return TaskModel.countDocuments({ userId, ...q });
  },

  unsetGoal: (userId: string, goalId: string) =>
    TaskModel.updateMany({ userId, goalId }, { $unset: { goalId: '' } }),
};
