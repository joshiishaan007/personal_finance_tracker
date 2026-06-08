import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/server/db';
import { pushService } from '@/server/push/push.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Vercel automatically sets CRON_SECRET and sends it as Bearer token.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const result = await pushService.sendDailyReminder();
  return NextResponse.json({ success: true, ...result });
}
