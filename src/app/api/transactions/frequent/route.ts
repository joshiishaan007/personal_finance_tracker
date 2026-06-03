import { catchRoute } from '@/server/http/catchRoute';
import { transactionController as c } from '@/server/transaction/transaction.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.frequent);
