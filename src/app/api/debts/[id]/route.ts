import { catchRoute } from '@/server/http/catchRoute';
import { debtController as c } from '@/server/debt/debt.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH  = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
