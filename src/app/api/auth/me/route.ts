import { catchRoute, requireAuth, ok, fail } from '@/server/http';
import { authService } from '@/server/auth/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = catchRoute(async () => {
  const { userId } = requireAuth();
  const user = await authService.getById(userId);
  if (!user) return fail('not_found');
  return ok(user);
});
