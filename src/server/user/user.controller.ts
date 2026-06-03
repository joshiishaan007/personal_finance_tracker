import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth, validateBody, ok, fail } from '../http';
import { UpdatePreferencesSchema } from '@/shared';
import { userService as svc } from './user.service';

export const userController = {
  async updatePreferences(req: NextRequest) {
    const { userId } = requireAuth();
    const data = validateBody(UpdatePreferencesSchema, await req.json());
    const user = await svc.updatePreferences(userId, data);
    return ok(user);
  },

  async deleteAccount(req: NextRequest) {
    const { userId } = requireAuth();
    const { confirmEmail } = (await req.json().catch(() => ({}))) as { confirmEmail?: string };
    const r = await svc.deleteAccount(userId, confirmEmail);
    if (r.state === 'error') {
      return r.reason === 'not_found'
        ? fail('not_found', 'User not found')
        : fail('bad_request', 'Email confirmation does not match');
    }
    const res = NextResponse.json({ success: true, message: 'Account and all data permanently deleted' });
    res.cookies.delete('token');
    return res;
  },
};
