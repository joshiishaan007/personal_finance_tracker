import { catchRoute } from '@/server/http/catchRoute';
import { instantCardController as c } from '@/server/instantCard/instantCard.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
