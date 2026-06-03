import { categoryRepository as repo } from './category.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateCategory, UpdateCategory } from '@/shared';

export const categoryService = {
  list: (userId: string) => repo.list(userId),

  create: (userId: string, data: CreateCategory) => repo.create({ ...data, userId }),

  async update(userId: string, id: string, data: UpdateCategory): Promise<Result<unknown, 'not_found'>> {
    const cat = await repo.update(userId, id, data as Record<string, unknown>);
    return cat ? Ok(cat) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ success: true }, 'not_found'>> {
    const cat = await repo.remove(userId, id);
    return cat ? Ok({ success: true }) : Err('not_found');
  },
};
