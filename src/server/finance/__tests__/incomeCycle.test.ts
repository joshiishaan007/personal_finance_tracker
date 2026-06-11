import { describe, it, expect } from 'vitest';
import { resolveIncomeCycle, type IncomeRow } from '../incomeCycle';

const now = new Date(2026, 5, 15); // 15 Jun 2026 (month is 0-indexed)

describe('resolveIncomeCycle — calendar month', () => {
  it('spans the whole calendar month regardless of income', () => {
    const c = resolveIncomeCycle([], now);
    expect(c.start).toEqual(new Date(2026, 5, 1));
    expect(c.end).toEqual(new Date(2026, 6, 1));
    expect(c.label).toBe('June 2026');
  });

  it('base income is 0 before any salary (expenses still tracked over the month)', () => {
    const c = resolveIncomeCycle([], now);
    expect(c.baseIncome).toBe(0);
    expect(c.source).toBe('none');
  });

  it('sums every income in the month — multiple salaries accumulate', () => {
    const incomes: IncomeRow[] = [
      { date: new Date(2026, 5, 12), amount: 2_000_000 },
      { date: new Date(2026, 5, 14), amount: 1_000_000 },
    ];
    const c = resolveIncomeCycle(incomes, now);
    expect(c.baseIncome).toBe(3_000_000);
    expect(c.source).toBe('income-sum');
  });

  it('excludes income from other months', () => {
    const incomes: IncomeRow[] = [
      { date: new Date(2026, 4, 30), amount: 9_999 }, // May — excluded
      { date: new Date(2026, 5, 2),  amount: 5_000 }, // June — included
      { date: new Date(2026, 6, 1),  amount: 1_111 }, // July — excluded
    ];
    expect(resolveIncomeCycle(incomes, now).baseIncome).toBe(5_000);
  });
});
