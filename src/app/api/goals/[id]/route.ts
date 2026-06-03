import { catchRoute } from '@/server/http/catchRoute';
import { goalController as c } from '@/server/goal/goal.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
