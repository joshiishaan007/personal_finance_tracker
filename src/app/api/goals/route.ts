import { catchRoute } from '@/server/http/catchRoute';
import { goalController as c } from '@/server/goal/goal.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.list);
export const POST = catchRoute(c.create);
