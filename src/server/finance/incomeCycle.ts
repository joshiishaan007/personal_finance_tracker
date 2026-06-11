// Pure income-cycle resolver — no DB access (callers fetch income rows via their
// repository and pass them in). The spending-plan period is the whole CALENDAR
// MONTH: expenses count for the entire month regardless of when (or whether)
// salary is entered, and every income in the month sums into the base the plan
// percentages apply to — so adding salary on any date just raises the targets.

export interface IncomeRow {
  date: Date;
  amount: number; // minor units
}

export interface ResolvedCycle {
  start: Date;
  end: Date;
  baseIncome: number; // minor units that the plan percentages apply to
  source: 'salary' | 'income-sum' | 'none';
  label: string;
}

function fmtMonth(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(d);
}

// `incomes` may be in any order. `now` is the reference instant (defaults to today).
export function resolveIncomeCycle(incomes: IncomeRow[], now: Date): ResolvedCycle {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Every income dated within the month sums into the base (cumulative salary).
  const baseIncome = incomes
    .filter((i) => i.date >= start && i.date < end)
    .reduce((s, i) => s + i.amount, 0);

  return {
    start,
    end,
    baseIncome,
    source: baseIncome > 0 ? 'income-sum' : 'none',
    label: fmtMonth(start),
  };
}
