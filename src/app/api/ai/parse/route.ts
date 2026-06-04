import { catchRoute } from '@/server/http/catchRoute';
import { aiController as c } from '@/server/ai/ai.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Newer Gemini models (2.5-flash, gemma-4-31b) can take 30-50s. Vercel Hobby
// cap is 60s — set maxDuration at the ceiling so the SDK timeout fires first.
export const maxDuration = 60;

export const POST = catchRoute(c.parse);
