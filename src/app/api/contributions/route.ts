import { catchRoute } from '@/server/http/catchRoute';
import { contributionController as c } from '@/server/contribution/contribution.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.list);
export const POST = catchRoute(c.create);
