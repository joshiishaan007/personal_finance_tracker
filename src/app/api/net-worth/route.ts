import { catchRoute } from '@/server/http/catchRoute';
import { netWorthController as c } from '@/server/netWorth/netWorth.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.list);
export const POST = catchRoute(c.upsert);
