import { describe, it, expect } from 'vitest';
import { deriveInsights, type InsightInput } from '@/lib/insights';

const base: InsightInput = {
  currency: 'INR',
  summary: { income: 100_000, expense: 40_000, net: 60_000, savingsRate: 60 },
  topCategories: [],
  buckets: [],
  planHasIncome: false,
  upcoming: { count: 0, total: 0 },
  prevNet: null,
};

describe('deriveInsights (local, rule-based)', () => {
  it('flags overspending when net is negative', () => {
    const out = deriveInsights({ ...base, summary: { income: 50_000, expense: 70_000, net: -20_000, savingsRate: -40 } });
    expect(out.some((i) => i.id === 'overspend' && i.tone === 'danger')).toBe(true);
  });

  it('praises a strong savings rate', () => {
    const out = deriveInsights(base);
    expect(out.some((i) => i.id === 'great-savings' && i.tone === 'positive')).toBe(true);
  });

  it('warns on a low savings rate', () => {
    const out = deriveInsights({ ...base, summary: { income: 100_000, expense: 95_000, net: 5_000, savingsRate: 5 } });
    expect(out.some((i) => i.id === 'low-savings' && i.tone === 'warning')).toBe(true);
  });

  it('surfaces top-category concentration over 40%', () => {
    const out = deriveInsights({ ...base, summary: { income: 100_000, expense: 50_000, net: 50_000, savingsRate: 50 }, topCategories: [{ name: 'Rent', total: 30_000 }] });
    expect(out.some((i) => i.id === 'concentration' && i.title.includes('Rent'))).toBe(true);
  });

  it('flags an over-allocated spending-plan bucket', () => {
    const out = deriveInsights({
      ...base,
      planHasIncome: true,
      buckets: [{ name: 'Wants', kind: 'wants', used: 12_000, allocated: 10_000, remaining: -2_000 }],
    });
    expect(out.some((i) => i.id === 'over-Wants' && i.tone === 'danger')).toBe(true);
  });

  it('returns nothing useful for an empty first-run state', () => {
    const out = deriveInsights({ ...base, summary: { income: 0, expense: 0, net: 0, savingsRate: 0 } });
    expect(out).toHaveLength(0);
  });

  it('orders danger before positive and caps the list', () => {
    const out = deriveInsights({
      ...base,
      summary: { income: 50_000, expense: 70_000, net: -20_000, savingsRate: -40 },
      prevNet: 100_000,
    });
    expect(out[0]!.tone).toBe('danger');
    expect(out.length).toBeLessThanOrEqual(6);
  });
});
