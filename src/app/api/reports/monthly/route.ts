import { catchRoute } from '@/server/http/catchRoute';
import { reportsController as c } from '@/server/reports/reports.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.monthly);
