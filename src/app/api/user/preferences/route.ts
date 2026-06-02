import { catchRoute } from '@/server/http/catchRoute';
import { userController as c } from '@/server/user/user.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.updatePreferences);
