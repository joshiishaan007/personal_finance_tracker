import { catchRoute } from '@/server/http/catchRoute';
import { lifeGoalController as c } from '@/server/lifeGoal/lifeGoal.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Static segment 'summary' takes precedence over the dynamic [id] route.
export const GET = catchRoute(c.summary);
