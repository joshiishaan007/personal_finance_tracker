import { catchRoute } from '@/server/http/catchRoute';
import { budgetController as c } from '@/server/budget/budget.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.list);
export const POST = catchRoute(c.create);
