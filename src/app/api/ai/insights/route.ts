import { catchRoute } from '@/server/http/catchRoute';
import { aiController as c } from '@/server/ai/ai.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Gemini is buffered (~10s); give the route headroom over the default.
export const maxDuration = 30;

export const GET = catchRoute(c.insights);
