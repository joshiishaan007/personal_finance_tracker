import { catchRoute } from '@/server/http/catchRoute';
import { spendingPlanController as c } from '@/server/spendingPlan/spendingPlan.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export const GET = catchRoute(c.history);
