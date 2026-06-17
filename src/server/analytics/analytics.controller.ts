import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '../http/requireAuth';
import { validateQuery } from '../http/validate';
import { ok } from '../http/respond';
import { analyticsService as svc } from './analytics.service';

const YearMonthSchema = z.object({
  year: z.coerce.number().int(),
  month: z.coerce.number().int().min(1).max(12),
});

const YearSchema = z.object({
  year: z.coerce.number().int(),
});

const DateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export const analyticsController = {
  async dashboard() {
    const { userId } = await requireAuth();
    return ok(await svc.dashboard(userId));
  },

  async monthly(req: NextRequest) {
    const { userId } = await requireAuth();
    const { year, month } = validateQuery(YearMonthSchema, req);
    return ok(await svc.monthly(userId, year, month));
  },

  async yearly(req: NextRequest) {
    const { userId } = await requireAuth();
    const { year } = validateQuery(YearSchema, req);
    return ok(await svc.yearly(userId, year));
  },

  async custom(req: NextRequest) {
    const { userId } = await requireAuth();
    const { startDate, endDate } = validateQuery(DateRangeSchema, req);
    return ok(await svc.custom(userId, startDate, endDate));
  },

  async monthlyPL() {
    const { userId } = await requireAuth();
    return ok(await svc.monthlyPL(userId));
  },

  async tags(req: NextRequest) {
    const { userId } = await requireAuth();
    const { year, month } = validateQuery(YearMonthSchema, req);
    return ok(await svc.tags(userId, year, month));
  },

  async spendingHeatmap() {
    const { userId } = await requireAuth();
    return ok(await svc.spendingHeatmap(userId));
  },
};
