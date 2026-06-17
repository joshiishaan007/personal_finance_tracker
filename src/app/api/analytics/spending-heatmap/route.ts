import { catchRoute } from '@/server/http/catchRoute';
import { analyticsController as c } from '@/server/analytics/analytics.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export const GET = catchRoute(c.spendingHeatmap);
