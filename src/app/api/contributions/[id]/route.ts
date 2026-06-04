import { catchRoute } from '@/server/http/catchRoute';
import { contributionController as c } from '@/server/contribution/contribution.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const DELETE = catchRoute(c.remove);
