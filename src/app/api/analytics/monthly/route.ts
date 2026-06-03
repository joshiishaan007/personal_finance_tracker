import { catchRoute } from '@/server/http/catchRoute';
import { analyticsController as c } from '@/server/analytics/analytics.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.monthly);
