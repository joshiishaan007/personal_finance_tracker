import { catchRoute } from '@/server/http/catchRoute';
import { spendingPlanController as c } from '@/server/spendingPlan/spendingPlan.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

export const GET = catchRoute(c.get);
export const PATCH = catchRoute(c.update);
