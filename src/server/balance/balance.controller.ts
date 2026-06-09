import { requireAuth } from '../http/requireAuth';
import { ok } from '../http/respond';
import { balanceService as svc } from './balance.service';

export const balanceController = {
  async get() {
    const { userId } = await requireAuth();
    return ok(await svc.get(userId));
  },
};
