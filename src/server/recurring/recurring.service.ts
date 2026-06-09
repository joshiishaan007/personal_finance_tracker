import { createHash } from 'crypto';
import { recurringRepository as repo } from './recurring.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateRecurringRule, UpdateRecurringRule } from '@/shared';

function advanceDate(date: Date, frequency: string): Date {
  const next = new Date(date);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

export const recurringService = {
  list: (userId: string) => repo.list(userId),

  create: (userId: string, data: CreateRecurringRule) =>
    repo.create({
      ...data,
      userId,
      nextDueDate: new Date(data.nextDueDate),
    }),

  async update(userId: string, id: string, data: UpdateRecurringRule): Promise<Result<unknown, 'not_found'>> {
    const rule = await repo.update(userId, id, data as Record<string, unknown>);
    return rule ? Ok(rule) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const rule = await repo.remove(userId, id);
    return rule ? Ok({ deleted: true }) : Err('not_found');
  },

  // Idempotent: generates all due transactions since last run. Call on login.
  async generate(userId: string) {
    const rules = await repo.listActive(userId);
    const now = new Date();
    let generated = 0;

    // Hard safety cap per rule per run — a far-past or daily rule must not spin
    // tens of thousands of iterations + DB writes in a single request.
    const MAX_ITERATIONS = 500;
    // Never backfill more than ~1 year; anything older is clamped to this window.
    const earliest = new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000);

    for (const rule of rules) {
      let current = new Date(rule.nextDueDate);
      if (current < earliest) current = earliest;
      let iterations = 0;
      while (current <= now && iterations < MAX_ITERATIONS) {
        iterations++;
        const hash = createHash('sha256')
          .update(`recurring|${String(rule._id)}|${current.toISOString()}`)
          .digest('hex');
        const exists = await repo.findTransactionByHash(userId, hash);
        if (!exists && rule.autoPost) {
          await repo.createTransaction({
            ...rule.templateTransaction,
            userId,
            date: current,
            isRecurring: true,
            recurringRuleId: rule._id,
            hash,
            schemaVersion: 1,
          });
          generated++;
        }
        current = advanceDate(current, rule.frequency);
      }
      await repo.advance(userId, String(rule._id), {
        nextDueDate: current,
        lastGeneratedDate: now,
      });
    }

    return { generated };
  },
};
