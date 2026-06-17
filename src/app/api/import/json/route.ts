import { catchRoute } from '@/server/http/catchRoute';
import { importController as c } from '@/server/import/import.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A large restore inserts many rows — give it more headroom than a normal route.
export const maxDuration = 30;

export const POST = catchRoute(c.json);
