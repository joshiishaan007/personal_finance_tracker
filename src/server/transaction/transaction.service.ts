import { createHash } from 'crypto';
import { transactionRepository as repo } from './transaction.repository';
import { debtRepository } from '../debt/debt.repository';
import { loanRepository } from '../loan/loan.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateTransaction, UpdateTransaction, TransactionFilter } from '@/shared';

// Per-user dedup key for transactions + CSV import idempotency.
export function makeHash(date: string, amount: number, note?: string): string {
  return createHash('sha256').update(`${date}|${amount}|${note ?? ''}`).digest('hex');
}

interface CsvMapping {
  dateColumn: string;
  amountColumn: string;
  noteColumn?: string;
  defaultType?: string;
  defaultCategoryId?: string;
  amountIsMinorUnits?: boolean;
}

export const transactionService = {
  list: (userId: string, filter: TransactionFilter) => repo.list(userId, filter),

  create: (userId: string, data: CreateTransaction) => {
    const hash = makeHash(data.date, data.amount, data.note);
    const doc = {
      ...data,
      userId,
      hash,
      date: new Date(data.date),
      incurredAt: data.incurredAt ? new Date(data.incurredAt) : undefined,
      schemaVersion: 1,
    };
    // clientId present (offline-capable path) → idempotent upsert so replays don't
    // duplicate; otherwise a plain insert (two identical entries stay distinct).
    return data.clientId ? repo.upsertByClientId(userId, data.clientId, doc) : repo.create(doc);
  },

  async update(userId: string, id: string, data: UpdateTransaction): Promise<Result<unknown, 'not_found'>> {
    const tx = await repo.update(userId, id, data as Record<string, unknown>);
    return tx ? Ok(tx) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const tx = await repo.remove(userId, id);
    if (!tx) return Err('not_found');
    // Cascade: remove any split debts that were linked to this transaction as their source,
    // and revert any debt that was *settled* via this transaction back to pending so its
    // settlement link can't dangle.
    await debtRepository.deleteBySourceTx(userId, id);
    await debtRepository.unlinkSettlementTx(userId, id);
    // Deleting an EMI expense drops the matching loan payment.
    await loanRepository.unlinkPayment(userId, id);
    return Ok({ deleted: true });
  },

  previewImport(records: Record<string, string>[], mapping: CsvMapping) {
    const preview = records.slice(0, 10).map((row) => ({
      date: row[mapping.dateColumn],
      amount: parseFloat(row[mapping.amountColumn] ?? '0'),
      note: mapping.noteColumn ? row[mapping.noteColumn] : undefined,
      type: mapping.defaultType ?? 'expense',
    }));
    return { preview, totalRows: records.length, headers: Object.keys(records[0] ?? {}) };
  },

  async commitImport(userId: string, records: Record<string, string>[], mapping: CsvMapping) {
    const importBatchId = createHash('sha256').update(`${userId}${Date.now()}`).digest('hex').slice(0, 16);

    // Build candidate rows + dedup within the file in one pass (no DB I/O yet).
    const seenHashes = new Set<string>();
    const candidates: Array<{ hash: string; doc: Record<string, unknown> }> = [];
    for (const row of records) {
      const rawAmount = parseFloat(row[mapping.amountColumn] ?? '0');
      // amountIsMinorUnits: values already in paise/cents; else convert major→minor.
      const amount = mapping.amountIsMinorUnits ? Math.round(rawAmount) : Math.round(rawAmount * 100);
      const dateStr = row[mapping.dateColumn] ?? '';
      const note = mapping.noteColumn ? row[mapping.noteColumn] : undefined;
      const hash = makeHash(dateStr, amount, note);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
      candidates.push({
        hash,
        doc: {
          userId,
          amount,
          date: new Date(dateStr),
          note,
          type: mapping.defaultType ?? 'expense',
          categoryId: mapping.defaultCategoryId,
          paymentMethod: 'other',
          tags: [],
          isRecurring: false,
          importBatchId,
          hash,
          schemaVersion: 1,
        },
      });
    }

    // Single batched existence check instead of one findByHash per row.
    const existing = await repo.findExistingHashes(userId, [...seenHashes]);
    const toInsert = candidates.filter((c) => !existing.has(c.hash)).map((c) => c.doc);

    if (toInsert.length) await repo.insertMany(toInsert);
    return { imported: toInsert.length, skipped: records.length - toInsert.length, batchId: importBatchId };
  },

  async rollbackImport(userId: string, batchId: string) {
    const result = await repo.deleteBatch(userId, batchId);
    return { deleted: result.deletedCount };
  },

  async frequent(userId: string) {
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const rows = await repo.frequentTemplates(userId, since, 6);
    return rows.map((r) => ({
      categoryId: String(r._id.categoryId),
      amount: r._id.amount,
      paymentMethod: r._id.paymentMethod,
      count: r.count,
      categoryName: r.category?.name ?? null,
      categoryIcon: r.category?.icon ?? null,
    }));
  },
};
