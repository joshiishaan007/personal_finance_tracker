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

async function parseUpload(req: NextRequest): Promise<{ records: Record<string, string>[]; mapping: Record<string, string> }> {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) throw new HttpError(400, 'No file uploaded');
  if (file.size > 10 * 1024 * 1024) throw new HttpError(400, 'File too large');
  const buffer = Buffer.from(await file.arrayBuffer());
  const records = parse(buffer, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
  const mapping: Record<string, string> = {};
  for (const [k, v] of form.entries()) {
    if (typeof v === 'string') mapping[k] = v;
  }
  return { records, mapping };
}

export const transactionController = {
  async list(req: NextRequest) {
    const { userId } = requireAuth();
    const filter = validateQuery(TransactionFilterSchema, req);
    const { items, total } = await svc.list(userId, filter);
    return ok({ items, total, page: filter.page, limit: filter.limit, hasMore: filter.page * filter.limit < total });
  },

  async create(req: NextRequest) {
    const { userId } = requireAuth();
    const data = validateBody(CreateTransactionSchema, await req.json());
    const tx = await svc.create(userId, data);
    return created(tx);
  },

  async update(req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const data = validateBody(UpdateTransactionSchema, await req.json());
    const r = await svc.update(userId, String(ctx.params.id), data);
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async remove(_req: NextRequest, ctx: RouteCtx) {
    const { userId } = requireAuth();
    const r = await svc.remove(userId, String(ctx.params.id));
    return r.state === 'ok' ? ok(r.data) : fail(r.reason);
  },

  async importPreview(req: NextRequest) {
    requireAuth();
    const { records, mapping } = await parseUpload(req);
    return ok(svc.previewImport(records, {
      dateColumn: mapping.dateColumn,
      amountColumn: mapping.amountColumn,
      noteColumn: mapping.noteColumn,
      defaultType: mapping.defaultType,
    }));
  },

  async importCommit(req: NextRequest) {
    const { userId } = requireAuth();
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
    const { userId } = requireAuth();
    const result = await svc.rollbackImport(userId, String(ctx.params.batchId));
    return ok(result);
  },
};
