import { catchRoute } from '@/server/http/catchRoute';
import { engagementController as c } from '@/server/engagement/engagement.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.daily);
