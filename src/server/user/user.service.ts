import { userRepository as repo } from './user.repository';
import { Ok, Err, type Result } from '../http/result';
import type { UpdatePreferences } from '@/shared';

export const userService = {
  updatePreferences(userId: string, data: UpdatePreferences) {
    const { timezone, ...prefFields } = data;
    const update: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(prefFields)) {
      update[`preferences.${k}`] = v;
    }
    if (timezone) update['timezone'] = timezone;
    return repo.updateById(userId, update);
  },

  async deleteAccount(userId: string, confirmEmail?: string): Promise<Result<{ deleted: true }, 'not_found' | 'bad_request'>> {
    const user = await repo.findById(userId);
    if (!user) return Err('not_found');
    if (confirmEmail !== user.email) return Err('bad_request');
    await repo.deleteAllData(userId);
    return Ok({ deleted: true });
  },
};
