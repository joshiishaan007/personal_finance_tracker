import { catchRoute } from '@/server/http/catchRoute';
import { categoryController as c } from '@/server/category/category.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.update);
export const DELETE = catchRoute(c.remove);
