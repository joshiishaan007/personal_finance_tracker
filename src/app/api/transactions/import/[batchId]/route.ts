import { catchRoute } from '@/server/http/catchRoute';
import { transactionController as c } from '@/server/transaction/transaction.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const DELETE = catchRoute(c.importRollback);
