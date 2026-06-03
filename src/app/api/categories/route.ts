import { catchRoute } from '@/server/http/catchRoute';
import { categoryController as c } from '@/server/category/category.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(c.list);
export const POST = catchRoute(c.create);
