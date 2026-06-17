import { Types } from 'mongoose';
import { importRepository as repo } from './import.repository';
import { transactionRepository as txRepo } from '../transaction/transaction.repository';
import { makeHash } from '../transaction/transaction.service';
import type { ImportBackup, ImportResult } from '@/shared';

const GOAL_STATUS = ['active', 'achieved', 'paused'];

export const importService = {
  // Additive restore: only rows that don't already exist are inserted, so a
  // backup can be merged into the same account (after a Trash purge) or a fresh
  // one without ever overwriting or duplicating existing data.
  async restore(userId: string, backup: ImportBackup): Promise<ImportResult> {
    let skipped = 0;

    // Categories — resolve each backup category to an id on THIS account, creating
    // the user-owned ones that are missing. The map keeps transactions/budgets
    // pointing at the right category even when ids differ across accounts.
    const idMap = new Map<string, string>();
    const existing = await repo.userCategories(userId);
    const byKey = new Map(existing.map((c) => [`${c.name.toLowerCase()}|${c.type}`, String(c._id)]));
    const newCats: Record<string, unknown>[] = [];
    for (const c of backup.categories) {
      // Default/global categories share stable ids across accounts — no remap.
      if (!c.userId || c.isDefault) {
        if (c._id) idMap.set(c._id, c._id);
        continue;
      }
      const key = `${c.name.toLowerCase()}|${c.type}`;
      const found = byKey.get(key);
      if (found) {
        if (c._id) idMap.set(c._id, found);
        continue;
      }
      const newId = new Types.ObjectId();
      newCats.push({ _id: newId, userId, name: c.name, icon: c.icon ?? '📦', color: c.color ?? '#6B7280', type: c.type, isDefault: false, schemaVersion: 1 });
      const sid = String(newId);
      if (c._id) idMap.set(c._id, sid);
      byKey.set(key, sid);
    }
    if (newCats.length) await repo.insertCategories(newCats);
    const remap = (cid?: string) => (cid ? idMap.get(cid) ?? cid : cid);

    // Transactions — dedup by hash (within the file and against what's stored).
    // _id and clientId are dropped so a re-import never collides on unique indexes.
    const seen = new Set<string>();
    const candidates: Array<{ hash: string; doc: Record<string, unknown> }> = [];
    for (const t of backup.transactions) {
      const amount = Math.round(t.amount);
      const hash = t.hash ?? makeHash(t.date, amount, t.note);
      if (seen.has(hash)) { skipped++; continue; }
      seen.add(hash);
      candidates.push({
        hash,
        doc: {
          userId, amount, type: t.type, categoryId: remap(t.categoryId),
          tags: t.tags ?? [], date: new Date(t.date), note: t.note,
          paymentMethod: t.paymentMethod ?? 'other', isRecurring: !!t.isRecurring,
          hash, schemaVersion: 1,
        },
      });
    }
    const alreadyStored = seen.size ? await txRepo.findExistingHashes(userId, [...seen]) : new Set<string>();
    const toInsert = candidates.filter((c) => !alreadyStored.has(c.hash));
    skipped += candidates.length - toInsert.length;
    if (toInsert.length) await txRepo.insertMany(toInsert.map((c) => c.doc));

    // Budgets — unique per (userId, categoryId); skip categories already budgeted.
    const budgetCats = await repo.budgetCategoryIds(userId);
    const newBudgets: Record<string, unknown>[] = [];
    for (const b of backup.budgets) {
      const cid = remap(b.categoryId);
      if (!cid || budgetCats.has(cid)) { skipped++; continue; }
      budgetCats.add(cid);
      newBudgets.push({
        userId, categoryId: cid, amount: Math.round(b.amount),
        period: b.period === 'yearly' ? 'yearly' : 'monthly',
        startDate: b.startDate ? new Date(b.startDate) : new Date(),
        rollover: !!b.rollover, rolloverBalance: Math.round(b.rolloverBalance ?? 0),
        schemaVersion: 1,
      });
    }
    if (newBudgets.length) await repo.insertBudgets(newBudgets);

    // Goals — skip ones whose title already exists.
    const goalTitles = await repo.goalTitles(userId);
    const newGoals: Record<string, unknown>[] = [];
    for (const g of backup.goals) {
      const key = g.title.toLowerCase();
      if (goalTitles.has(key)) { skipped++; continue; }
      goalTitles.add(key);
      newGoals.push({
        userId, title: g.title, targetAmount: Math.round(g.targetAmount),
        savedAmount: Math.round(g.savedAmount ?? 0),
        deadline: g.deadline ? new Date(g.deadline) : undefined,
        icon: g.icon ?? '🎯', color: g.color ?? '#6366F1',
        status: g.status && GOAL_STATUS.includes(g.status) ? g.status : 'active',
        milestonesHit: g.milestonesHit ?? [], schemaVersion: 1,
      });
    }
    if (newGoals.length) await repo.insertGoals(newGoals);

    return {
      categories: newCats.length,
      transactions: toInsert.length,
      budgets: newBudgets.length,
      goals: newGoals.length,
      skipped,
    };
  },
};
