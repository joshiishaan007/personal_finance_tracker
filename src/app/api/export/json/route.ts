import { catchRoute } from '@/server/http/catchRoute';
import { exportController as c } from '@/server/export/export.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.json);
