import { catchRoute } from '@/server/http/catchRoute';
import { taskController as c } from '@/server/task/task.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
