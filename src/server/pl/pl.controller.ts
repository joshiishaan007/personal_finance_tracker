import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '../http/requireAuth';
import { validateQuery } from '../http/validate';
import { ok } from '../http/respond';
import { plService as svc } from './pl.service';

const YearMonthSchema = z.object({
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
});

export const plController = {
  async report(req: NextRequest) {
    const { userId } = requireAuth();
    const { year, month } = validateQuery(YearMonthSchema, req);
    return ok(await svc.report(userId, year, month));
  },
};
