import type { NextRequest } from 'next/server';
import { parse } from 'csv-parse/sync';
import { requireAuth } from '../http/requireAuth';
import { validateBody, validateQuery } from '../http/validate';
import { ok, created, fail } from '../http/respond';
import { HttpError } from '../http/errors';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  TransactionFilterSchema,
} from '@/shared';
import type { RouteCtx } from '../http/catchRoute';
import { transactionService as svc } from './transaction.service';
import { budgetAlertService } from '../push/budgetAlert.service';

async function parseUpload(req: NextRequest): Promise<{ records: Record<string, string>[]; mapping: Record<string, string> }> {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) throw new HttpError(400, 'No file uploaded');
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, 'File too large');
  const buffer = Buffer.from(await file.arrayBuffer());
  const records = parse(buffer, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  // Bound the row count so a small-but-dense file can't trigger a huge insert/scan.
  if (records.length > 5000) throw new HttpError(400, 'Too many rows (max 5000 per import)');
  const mapping: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === 'string') mapping[k] = v;
  }
  return { records, mapping };
}

export const transactionController = {
  async list(req: NextRequest) {
    const { userId } = await requireAuth();
    const filter = validateQuery(TransactionFilterSchema, req);
    const { items, total } = await svc.list(userId, filter);
    return ok({ items, total, page: filter.page, limit: filter.limit, hasMore: filter.page * filter.limit < total });
  },

  async frequent(_req: NextRequest) {
    const { userId } = await requireAuth();
    return ok(await svc.frequent(userId));
  },

  async create(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(CreateTransactionSchema, await req.json());
    const tx = await svc.create(userId, data);
    // Fire-and-forget: check budget thresholds for expense transactions without
    // blocking the API response. Errors inside are swallowed by catchRoute's scope.
    if (data.type === 'expense') {
      void budgetAlertService.checkAfterTransaction(userId, data.categoryId, new Date(data.date));
    }
    return created(tx);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdateTransactionSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async importPreview(req: NextRequest) {
    await requireAuth();
    const { records, mapping } = await parseUpload(req);
    return ok(svc.previewImport(records, {
      dateColumn: mapping.dateColumn,
      amountColumn: mapping.amountColumn,
      noteColumn: mapping.noteColumn,
      defaultType: mapping.defaultType,
    }));
  },

  async importCommit(req: NextRequest) {
    const { userId } = await requireAuth();
    const { records, mapping } = await parseUpload(req);
    const result = await svc.commitImport(userId, records, {
      dateColumn: mapping.dateColumn,
      amountColumn: mapping.amountColumn,
      noteColumn: mapping.noteColumn,
      defaultType: mapping.defaultType,
      defaultCategoryId: mapping.defaultCategoryId,
      amountIsMinorUnits: mapping.amountIsMinorUnits === 'true',
    });
    return ok(result);
  },

  async importRollback(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = await requireAuth();
    const result = await svc.rollbackImport(userId, String(ctx.params.batchId));
    return ok(result);
  },
};
