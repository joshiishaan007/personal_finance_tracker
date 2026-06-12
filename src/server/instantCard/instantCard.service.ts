import { instantCardRepository as repo } from './instantCard.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateInstantCard, UpdateInstantCard } from '@/shared';

export const instantCardService = {
  list: (userId: string) => repo.list(userId),

  create: (userId: string, data: CreateInstantCard) => repo.create(userId, data),

  async update(userId: string, id: string, data: UpdateInstantCard): Promise<Result<unknown, 'not_found'>> {
    const doc = await repo.update(userId, id, data);
    return doc ? Ok(doc) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const doc = await repo.remove(userId, id);
    return doc ? Ok({ deleted: true }) : Err('not_found');
  },

  async reorder(userId: string, ids: string[]): Promise<{ reordered: number }> {
    await repo.reorder(userId, ids);
    return { reordered: ids.length };
  },
};
