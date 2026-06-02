import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateQuery, ok } from '../http';
import { reportsService as svc } from './reports.service';

const MonthlyReportQuerySchema = z.object({
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
});

const YearlyReportQuerySchema = z.object({
  year: z.coerce.number().int(),
});

export const reportsController = {
  async monthly(req: NextRequest) {
    const { userId } = requireAuth();
    const { year, month } = validateQuery(MonthlyReportQuerySchema, req);
    const data = await svc.monthly(userId, year, month);
    return ok(data);
  },

  async yearly(req: NextRequest) {
    const { userId } = requireAuth();
    const { year } = validateQuery(YearlyReportQuerySchema, req);
    const data = await svc.yearly(userId, year);
    return ok(data);
  },
};
