import { catchRoute } from '@/server/http/catchRoute';
import { pushController as c } from '@/server/push/push.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = catchRoute(c.subscribe);
