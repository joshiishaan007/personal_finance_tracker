import { catchRoute } from '@/server/http/catchRoute';
import { lifeGoalController as c } from '@/server/lifeGoal/lifeGoal.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.today);
