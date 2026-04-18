import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionFilterSchema,
  CSVImportMappingSchema,
} from '@finbuddy/shared';
import { TransactionModel } from '../models/transaction.model';
import { createHash } from 'crypto';
import multer from 'multer';
import type { AuthRequest } from '../middleware/auth.middleware';
import type { Request } from 'express';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router: import('express').Router = Router();
router.use(requireAuth);

function makeHash(date: string, amount: number, note?: string): string {
  return createHash('sha256').update(`${date}|${amount}|${note ?? ''}`).digest('hex');
}

router.get('/', validate(TransactionFilterSchema, 'query'), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const filter = req.query as unknown as {
    page: number; limit: number; startDate?: string; endDate?: string;
    type?: string; categoryId?: string; tags?: string[]; minAmount?: number;
    maxAmount?: number; paymentMethod?: string; search?: string;
  };
  const { page, limit, startDate, endDate, type, categoryId, tags, minAmount, maxAmount, paymentMethod, search } = filter;

  const query: Record<string, unknown> = { userId };
  if (startDate || endDate) {
    query.date = {
      ...(startDate && { $gte: new Date(startDate) }),
      ...(endDate && { $lte: new Date(endDate) }),
    };
  }
  if (type) query.type = type;
  if (categoryId) query.categoryId = categoryId;
  if (tags?.length) query.tags = { $in: tags };
  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {
      ...(minAmount !== undefined && { $gte: minAmount }),
      ...(maxAmount !== undefined && { $lte: maxAmount }),
    };
  }
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (search) {
    query.$or = [
      { note: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    TransactionModel.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TransactionModel.countDocuments(query),
  ]);

  res.json({ success: true, data: { items, total, page, limit, hasMore: page * limit < total } });
});

router.post('/', validate(CreateTransactionSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const data = req.body as { date: string; amount: number; note?: string; [k: string]: unknown };
  const hash = makeHash(data.date, data.amount, data.note);
  const tx = await TransactionModel.create({
    ...data,
    userId,
    hash,
    date: new Date(data.date),
    schemaVersion: 1,
  });
  res.status(201).json({ success: true, data: tx });
});

router.patch('/:id', validate(UpdateTransactionSchema), async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const tx = await TransactionModel.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: req.body },
    { new: true },
  );
  if (!tx) { res.status(404).json({ success: false, error: 'Transaction not found' }); return; }
  res.json({ success: true, data: tx });
});

router.delete('/:id', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const tx = await TransactionModel.findOneAndDelete({ _id: req.params.id, userId });
  if (!tx) { res.status(404).json({ success: false, error: 'Transaction not found' }); return; }
  res.json({ success: true });
});

// CSV import: preview first 10 rows
router.post('/import/preview', upload.single('file'), async (req: Request, res) => {
  if (!req.file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
  const { parse } = await import('csv-parse/sync');
  const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const mapping = req.body as { dateColumn: string; amountColumn: string; noteColumn?: string; defaultType?: string };
  const preview = records.slice(0, 10).map((row) => ({
    date: row[mapping.dateColumn],
    amount: parseFloat(row[mapping.amountColumn] ?? '0'),
    note: mapping.noteColumn ? row[mapping.noteColumn] : undefined,
    type: mapping.defaultType ?? 'expense',
  }));
  res.json({ success: true, data: { preview, totalRows: records.length, headers: Object.keys(records[0] ?? {}) } });
});

// CSV import: commit with dedup
router.post('/import/commit', upload.single('file'), async (req: Request, res) => {
  const { userId } = req as unknown as AuthRequest;
  if (!req.file) { res.status(400).json({ success: false, error: 'No file uploaded' }); return; }
  const { parse } = await import('csv-parse/sync');
  const records = parse(req.file.buffer, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const mapping = req.body as {
    dateColumn: string; amountColumn: string; noteColumn?: string;
    defaultType: string; defaultCategoryId: string; amountIsMinorUnits?: string;
  };
  const importBatchId = createHash('sha256').update(`${userId}${Date.now()}`).digest('hex').slice(0, 16);
  const seenHashes = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];

  for (const row of records) {
    const rawAmount = parseFloat(row[mapping.amountColumn] ?? '0');
    const amount = mapping.amountIsMinorUnits === 'true' ? Math.round(rawAmount) : Math.round(rawAmount * 100);
    const dateStr = row[mapping.dateColumn] ?? '';
    const note = mapping.noteColumn ? row[mapping.noteColumn] : undefined;
    const hash = makeHash(dateStr, amount, note);
    if (seenHashes.has(hash)) continue;
    seenHashes.add(hash);
    const exists = await TransactionModel.findOne({ userId, hash }).lean();
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

  if (toInsert.length) await TransactionModel.insertMany(toInsert);
  res.json({ success: true, data: { imported: toInsert.length, skipped: records.length - toInsert.length, batchId: importBatchId } });
});

// Rollback entire import batch
router.delete('/import/:batchId', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const result = await TransactionModel.deleteMany({ userId, importBatchId: req.params.batchId });
  res.json({ success: true, data: { deleted: result.deletedCount } });
});

export { router as transactionRouter };
