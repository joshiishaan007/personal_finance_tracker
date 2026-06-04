// Pure income-cycle resolver — no DB access (callers fetch income rows via their
// repository and pass them in). Infers a paycheck-to-paycheck cycle from income
// history so the spending plan period tracks a variable salary date instead of a
// fixed calendar month.

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

const DAY = 86_400_000;

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : Math.round((s[mid - 1]! + s[mid]!) / 2);
}

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(d);
}

// `incomes` may be in any order. `now` is the reference instant (defaults to today).
export function resolveIncomeCycle(incomes: IncomeRow[], now: Date): ResolvedCycle {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  if (incomes.length === 0) {
    const end = addMonths(monthStart, 1);
    return { start: monthStart, end, baseIncome: 0, source: 'none', label: `${fmt(monthStart)} – ${fmt(new Date(end.getTime() - DAY))}` };
  }

  const sorted = [...incomes].sort((a, b) => b.date.getTime() - a.date.getTime());

  // "Major" income = a paycheck-sized entry, filtering out small side income.
  // Threshold: at least half the largest income seen in the window.
  const maxAmount = Math.max(...sorted.map((i) => i.amount));
  const major = sorted.filter((i) => i.amount >= maxAmount * 0.5);

  // Cadence: median gap (days) between consecutive major paychecks; default ~1 month.
  const gaps: number[] = [];
  for (let i = 0; i < major.length - 1; i++) {
    gaps.push(Math.round((major[i]!.date.getTime() - major[i + 1]!.date.getTime()) / DAY));
  }
  const cadenceDays = gaps.length ? median(gaps) : 30;

  // Latest paycheck anchors the current cycle.
  const anchor = major[0] ?? sorted[0]!;
  const start = anchor.date;
  let end = new Date(start.getTime() + cadenceDays * DAY);
  // If the next paycheck is overdue, keep the window open through today.
  if (end < now) end = new Date(now.getTime() + DAY);

  // Base = income received within this cycle window (covers split/bonus paychecks).
  const baseIncome = incomes
    .filter((i) => i.date >= start && i.date < end)
    .reduce((s, i) => s + i.amount, 0);

  return {
    start,
    end,
    baseIncome,
    source: major.length > 0 ? 'salary' : 'income-sum',
    label: `${fmt(start)} – ${fmt(new Date(end.getTime() - DAY))}`,
  };
}
