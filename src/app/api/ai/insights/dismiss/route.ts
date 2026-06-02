import { catchRoute } from '@/server/http/catchRoute';
import { aiController as c } from '@/server/ai/ai.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = catchRoute(c.dismiss);
