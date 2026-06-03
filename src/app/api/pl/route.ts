import { catchRoute } from '@/server/http/catchRoute';
import { plController as c } from '@/server/pl/pl.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.report);
