// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { lifeGoalService } from '../lifeGoal.service';
import { contributionService } from '../../contribution/contribution.service';
import { taskService } from '../../task/task.service';
import { LifeGoalModel } from '../../models/lifeGoal.model';
import { ContributionModel } from '../../models/contribution.model';
import { TaskModel } from '../../models/task.model';

let mem: MongoMemoryServer;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'personal-finance-tracker' });
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

function makeGoal(userId: string, over: Partial<Parameters<typeof lifeGoalService.create>[1]> = {}) {
  return lifeGoalService.create(userId, {
    title: 'Read books', area: 'learning', icon: '📚', color: '#14B8A6',
    status: 'active', currentValue: 0, targetValue: 10, unit: 'books', ...over,
  });
}

describe('Goals domain (real Mongo)', () => {
  it('logging a contribution increments the goal currentValue', async () => {
    const userId = new Types.ObjectId().toString();
    const goal = await makeGoal(userId);
    await contributionService.create(userId, { goalId: String(goal._id), value: 3 });
    const updated = await LifeGoalModel.findById(goal._id).lean();
    expect(updated?.currentValue).toBe(3);
  });

  it('deleting a contribution decrements the goal currentValue', async () => {
    const userId = new Types.ObjectId().toString();
    const goal = await makeGoal(userId);
    const c = await contributionService.create(userId, { goalId: String(goal._id), value: 4 });
    await contributionService.remove(userId, String(c._id));
    const updated = await LifeGoalModel.findById(goal._id).lean();
    expect(updated?.currentValue).toBe(0);
  });

  it('summary reports progress, an active count, and a contribution streak', async () => {
    const userId = new Types.ObjectId().toString();
    const goal = await makeGoal(userId, { targetValue: 10 });
    await contributionService.create(userId, { goalId: String(goal._id), value: 3 });
    const s = await lifeGoalService.summary(userId);
    expect(s.activeGoals).toBe(1);
    expect(s.overallProgress).toBe(30); // 3 / 10
    expect(s.streak).toBeGreaterThanOrEqual(1); // contributed today
  });

  it('clearing targetValue on update unsets it instead of keeping the old value', async () => {
    const userId = new Types.ObjectId().toString();
    const goal = await makeGoal(userId, { targetValue: 10 });
    const r = await lifeGoalService.update(userId, String(goal._id), { targetValue: null });
    expect(r.state).toBe('ok');
    const doc = await LifeGoalModel.findById(goal._id).lean();
    expect(doc?.targetValue).toBeUndefined();
  });

  it('toggling a task done stamps doneAt', async () => {
    const userId = new Types.ObjectId().toString();
    const t = await taskService.create(userId, { title: 'Write', done: false, priority: 'med' });
    const r = await taskService.update(userId, String(t._id), { done: true });
    expect(r.state).toBe('ok');
    const td = await TaskModel.findById(t._id).lean();
    expect(td?.done).toBe(true);
    expect(td?.doneAt).toBeTruthy();
  });

  it('deleting a goal cascades to its contributions and unlinks its tasks', async () => {
    const userId = new Types.ObjectId().toString();
    const goal = await makeGoal(userId);
    await contributionService.create(userId, { goalId: String(goal._id), value: 1 });
    const task = await taskService.create(userId, { title: 'T', done: false, priority: 'med', goalId: String(goal._id) });

    const r = await lifeGoalService.remove(userId, String(goal._id));
    expect(r.state).toBe('ok');
    expect(await ContributionModel.countDocuments({ goalId: goal._id })).toBe(0);
    const td = await TaskModel.findById(task._id).lean();
    expect(td?.goalId).toBeFalsy(); // unlinked, not deleted
  });

  it('does not leak another user’s goals', async () => {
    const a = new Types.ObjectId().toString();
    await makeGoal(a);
    const list = await lifeGoalService.list(new Types.ObjectId().toString());
    expect(list).toHaveLength(0);
  });
});
