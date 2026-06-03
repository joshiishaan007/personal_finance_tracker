import { netWorthRepository as repo } from './netWorth.repository';
import type { UpsertNetWorth } from '@/shared';

export const netWorthService = {
  list: (userId: string) => repo.list(userId),

  latest: (userId: string) => repo.latest(userId),

  upsert: (userId: string, data: UpsertNetWorth) => {
    const { assets, liabilities } = data;
    const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
    const netWorth = totalAssets - totalLiabilities;
    const now = new Date();
    const monthKey = new Date(now.getFullYear(), now.getMonth(), 1);
    return repo.upsertForMonth(userId, monthKey, { assets, liabilities, netWorth });
  },
};
