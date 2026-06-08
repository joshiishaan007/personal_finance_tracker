import { catchRoute } from '@/server/http/catchRoute';
import { instantCardController as c } from '@/server/instantCard/instantCard.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET  = catchRoute(c.list);
export const POST = catchRoute(c.create);
