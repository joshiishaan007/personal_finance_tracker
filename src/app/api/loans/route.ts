import { catchRoute } from '@/server/http/catchRoute';
import { loanController as c } from '@/server/loan/loan.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;

export const GET = catchRoute(c.list);
export const POST = catchRoute(c.create);
