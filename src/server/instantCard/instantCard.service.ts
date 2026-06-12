import { instantCardRepository as repo } from './instantCard.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateInstantCard } from '@/shared';

export const instantCardService = {
  list: (userId: string) => repo.list(userId),

  create: (userId: string, data: CreateInstantCard) => repo.create(userId, data),

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const doc = await repo.remove(userId, id);
    return doc ? Ok({ deleted: true }) : Err('not_found');
  },

  async reorder(userId: string, ids: string[]): Promise<{ reordered: number }> {
    await repo.reorder(userId, ids);
    return { reordered: ids.length };
  },
};
