import { NextResponse } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { exportService as svc } from './export.service';

export const exportController = {
  async json() {
    const { userId } = requireAuth();
    const payload = await svc.buildJson(userId);
    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="personal-finance-tracker-export-${Date.now()}.json"`,
      },
    });
  },

  async transactionsCsv() {
    const { userId } = requireAuth();
    const csv = await svc.buildTransactionsCsv(userId);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="transactions.csv"',
      },
    });
  },
};
