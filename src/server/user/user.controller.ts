import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAuth, validateBody, ok, fail } from '../http';
import { UpdatePreferencesSchema } from '@/shared';
import { userService as svc } from './user.service';

const DeleteAccountSchema = z.object({ confirmEmail: z.string().email() });

export const userController = {
  async updatePreferences(req: NextRequest) {
    const { userId } = await requireAuth();
    const data = validateBody(UpdatePreferencesSchema, await req.json());
    const user = await svc.updatePreferences(userId, data);
    return ok(user);
  },

  async deleteAccount(req: NextRequest) {
    const { userId } = await requireAuth();
    const { confirmEmail } = validateBody(DeleteAccountSchema, await req.json());
    const r = await svc.deleteAccount(userId, confirmEmail);
    if (r.state === 'error') {
      return r.reason === 'not_found'
        ? fail('not_found', 'User not found')
        : fail('bad_request', 'Email confirmation does not match');
    }
    const res = ok({ deleted: true });
    res.cookies.delete('token');
    return res;
  },
};
