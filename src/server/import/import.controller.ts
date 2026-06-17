import type { NextRequest } from 'next/server';
import { requireAuth } from '../http/requireAuth';
import { validateBody } from '../http/validate';
import { ok } from '../http/respond';
import { ImportBackupSchema } from '@/shared';
import { importService as svc } from './import.service';

export const importController = {
  async json(req: NextRequest) {
    const { userId } = await requireAuth();
    const backup = validateBody(ImportBackupSchema, await req.json());
    return ok(await svc.restore(userId, backup));
  },
};
