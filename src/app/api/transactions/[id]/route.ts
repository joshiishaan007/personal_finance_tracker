import { catchRoute } from '@/server/http/catchRoute';
import { transactionController as c } from '@/server/transaction/transaction.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

export const PATCH = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
