import { createHash } from 'crypto';
import { transactionRepository as repo } from './transaction.repository';
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
    return repo.create({ ...data, userId, hash, date: new Date(data.date), schemaVersion: 1 });
  },

  async update(userId: string, id: string, data: UpdateTransaction): Promise<Result<unknown, 'not_found'>> {
    const tx = await repo.update(userId, id, data as Record<string, unknown>);
    return tx ? Ok(tx) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const tx = await repo.remove(userId, id);
    return tx ? Ok({ deleted: true }) : Err('not_found');
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
    const seenHashes = new Set<string>();
    const toInsert: Record<string, unknown>[] = [];

    for (const row of records) {
      const rawAmount = parseFloat(row[mapping.amountColumn] ?? '0');
      // amountIsMinorUnits: values already in paise/cents; else convert major→minor.
      const amount = mapping.amountIsMinorUnits ? Math.round(rawAmount) : Math.round(rawAmount * 100);
      const dateStr = row[mapping.dateColumn] ?? '';
      const note = mapping.noteColumn ? row[mapping.noteColumn] : undefined;
      const hash = makeHash(dateStr, amount, note);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
      const exists = await repo.findByHash(userId, hash);
      if (exists) continue;
      toInsert.push({
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
      });
    }

    if (toInsert.length) await repo.insertMany(toInsert);
    return { imported: toInsert.length, skipped: records.length - toInsert.length, batchId: importBatchId };
  },

  async rollbackImport(userId: string, batchId: string) {
    const result = await repo.deleteBatch(userId, batchId);
    return { deleted: result.deletedCount };
  },
};
