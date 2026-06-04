import { grossPLRepository as repo } from './grossPL.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateGrossPL, UpdateGrossPL, GrossPLSummary } from '@/shared';

// First instant of the month (UTC) for the given date — the entry's canonical key.
function monthStartUTC(iso: string): Date {
  const d = new Date(iso);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

export const grossPLService = {
  async list(userId: string): Promise<GrossPLSummary> {
    const [entries, meta] = await Promise.all([repo.list(userId), repo.userMeta(userId)]);

    let running = 0;
    const cumulativeSeries: Array<{ month: string; value: number }> = [];
    const views = entries.map((e) => {
      const month = (e.month as Date).toISOString();
      running += e.amount;
      cumulativeSeries.push({ month, value: running });
      return {
        _id: String(e._id),
        month,
        amount: e.amount,
        ...(e.note ? { note: e.note } : {}),
      };
    });

    return {
      entries: views,
      cumulative: running,
      cumulativeSeries,
      currency: meta.currency,
    };
  },

  create: (userId: string, data: CreateGrossPL) => {
    const month = monthStartUTC(data.month);
    return repo.upsertByMonth(userId, month, {
      userId,
      month,
      amount: data.amount,
      note: data.note,
    });
  },

  async update(
    userId: string,
    id: string,
    data: UpdateGrossPL,
  ): Promise<Result<unknown, 'not_found'>> {
    const set: Record<string, unknown> = {};
    if (data.month !== undefined) set.month = monthStartUTC(data.month);
    if (data.amount !== undefined) set.amount = data.amount;
    if (data.note !== undefined) set.note = data.note;
    const entry = await repo.update(userId, id, set);
    return entry ? Ok(entry) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ success: true }, 'not_found'>> {
    const removed = await repo.remove(userId, id);
    return removed ? Ok({ success: true }) : Err('not_found');
  },
};
