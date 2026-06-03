import { catchRoute } from '@/server/http/catchRoute';
import { budgetController as c } from '@/server/budget/budget.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
