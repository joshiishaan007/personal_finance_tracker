import { lifeGoalRepository as repo } from './lifeGoal.repository';
import { contributionRepository } from '../contribution/contribution.repository';
import { taskRepository } from '../task/task.repository';
import { engagementRepository } from '../engagement/engagement.repository';
import { computeStreak } from '../engagement/engagement.service';
import { Ok, Err, type Result } from '../http/result';
import type { CreateLifeGoal, UpdateLifeGoal } from '@/shared';

interface Progressable { targetValue?: number; currentValue: number; manualProgress?: number }

// Measurable goals derive progress from current/target; otherwise manualProgress.
function progressPct(g: Progressable): number {
  if (g.targetValue && g.targetValue > 0) return Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
  return g.manualProgress ?? 0;
}

function dayStr(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

const DAY_MS = 86_400_000;

export const lifeGoalService = {
  list: (userId: string) => repo.list(userId),

  create: (userId: string, data: CreateLifeGoal) =>
    repo.create({ ...data, userId, targetDate: data.targetDate ? new Date(data.targetDate) : undefined }),

  async get(userId: string, id: string): Promise<Result<unknown, 'not_found'>> {
    const goal = await repo.findById(userId, id);
    return goal ? Ok(goal) : Err('not_found');
  },

  async update(userId: string, id: string, data: UpdateLifeGoal): Promise<Result<unknown, 'not_found'>> {
    const set = { ...data, ...(data.targetDate && { targetDate: new Date(data.targetDate) }) };
    const goal = await repo.update(userId, id, set);
    return goal ? Ok(goal) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const goal = await repo.remove(userId, id);
    if (!goal) return Err('not_found');
    // Cascade: a goal's contributions are meaningless without it; unlink its tasks.
    await contributionRepository.removeByGoal(userId, id);
    await taskRepository.unsetGoal(userId, id);
    return Ok({ deleted: true });
  },

  async summary(userId: string) {
    const { timezone } = await engagementRepository.userMeta(userId);
    const goals = await repo.list(userId);
    const active = goals.filter((g) => g.status === 'active');
    const overallProgress = active.length
      ? Math.round(active.reduce((s, g) => s + progressPct(g), 0) / active.length)
      : 0;

    const now = new Date();
    const days = await contributionRepository.loggedDays(userId, new Date(now.getTime() - 400 * DAY_MS), timezone);
    const streak = computeStreak(days, dayStr(now, timezone), dayStr(new Date(now.getTime() - DAY_MS), timezone));

    const tasksOpen = await taskRepository.count(userId, { done: false });
    const tasksOverdue = await taskRepository.count(userId, { overdue: true });

    return {
      totalGoals: goals.length,
      activeGoals: active.length,
      achievedGoals: goals.filter((g) => g.status === 'achieved').length,
      overallProgress,
      streak,
      tasksOpen,
      tasksOverdue,
    };
  },

  // Per-goal today value + current streak — powers the goals-home cards (today
  // ring for habits, one-tap "log today", per-goal streak).
  async today(userId: string): Promise<{ goalId: string; todayValue: number; streak: number }[]> {
    const { timezone } = await engagementRepository.userMeta(userId);
    const now = new Date();
    const rows = await contributionRepository.recentByGoal(userId, new Date(now.getTime() - 400 * DAY_MS), timezone);
    const today = dayStr(now, timezone);
    const yesterday = dayStr(new Date(now.getTime() - DAY_MS), timezone);

    const byGoal = new Map<string, { days: string[]; todayValue: number }>();
    for (const r of rows) {
      const e = byGoal.get(r.goalId) ?? { days: [], todayValue: 0 };
      e.days.push(r.day);
      if (r.day === today) e.todayValue = r.value;
      byGoal.set(r.goalId, e);
    }

    return [...byGoal.entries()].map(([goalId, e]) => ({
      goalId,
      todayValue: e.todayValue,
      streak: computeStreak(e.days, today, yesterday),
    }));
  },
};
