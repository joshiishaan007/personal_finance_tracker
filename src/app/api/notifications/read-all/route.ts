import { catchRoute } from '@/server/http/catchRoute';
import { notificationController as c } from '@/server/notification/notification.controller';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = catchRoute(c.readAll);
