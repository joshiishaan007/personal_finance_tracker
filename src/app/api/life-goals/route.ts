import { catchRoute } from '@/server/http/catchRoute';
import { lifeGoalController as c } from '@/server/lifeGoal/lifeGoal.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Cold-start headroom for the Atlas connection on Vercel (default cap is 10s).
export const maxDuration = 15;

export const GET = catchRoute(c.list);
export const POST = catchRoute(c.create);
