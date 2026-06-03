import { catchRoute } from '@/server/http/catchRoute';
import { recurringController as c } from '@/server/recurring/recurring.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
