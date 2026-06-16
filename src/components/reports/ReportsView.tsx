'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, LineChart, TrendingUp, TrendingDown, PiggyBank, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyAnalytics, useYearlyAnalytics } from '@/hooks/useAnalytics';
import { useYearlyReport } from '@/hooks/useReports';
import { fmt, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Heading } from '@/components/ui/Heading';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { AreaTrend } from '@/components/charts/lazy';
import { SkeletonCard } from '@/components/SkeletonLoader';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function totalFor(rows: Array<{ _id: string; total: number }> | undefined, type: string): number {
  return rows?.find((r) => r._id === type)?.total ?? 0;
}

export function ReportsView() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const [year, setYear] = useState(curYear);
  const [month, setMonth] = useState(curMonth);

  // Past-or-current only: can't step into the future.
  const isCurrent = year === curYear && month === curMonth;
  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;

  const { data: monthly, isLoading } = useMonthlyAnalytics(year, month);
  const { data: prevMonthly } = useMonthlyAnalytics(prevY, prevM);
  const { data: yearlyA } = useYearlyAnalytics(year);
  const { data: yearlyReport } = useYearlyReport(year);

  const income = monthly?.summary.income ?? 0;
  const expense = monthly?.summary.expense ?? 0;
  const net = monthly?.summary.net ?? 0;
  const savingsRate = monthly?.summary.savingsRate ?? 0;
  const prevNet = prevMonthly?.summary.net ?? 0;
  const netDelta = net - prevNet;

  const topCategories = (monthly?.byCategory ?? []).slice(0, 5);

  // Yearly trend + totals
  const incomeByMonth = new Map<number, number>();
  const expenseByMonth = new Map<number, number>();
  for (const m of yearlyA?.monthly ?? []) {
    const map = m._id.type === 'income' ? incomeByMonth : expenseByMonth;
    map.set(m._id.month, (map.get(m._id.month) ?? 0) + m.total);
  }
  const yearlyTrend = MONTH_NAMES.map((name, i) => ({
    name,
    income: incomeByMonth.get(i + 1) ?? 0,
    expense: expenseByMonth.get(i + 1) ?? 0,
    net: (incomeByMonth.get(i + 1) ?? 0) - (expenseByMonth.get(i + 1) ?? 0),
  }));
  const yearIncome = yearlyTrend.reduce((s, m) => s + m.income, 0);
  const yearExpense = yearlyTrend.reduce((s, m) => s + m.expense, 0);
  const yearNet = yearIncome - yearExpense;
  const bestMonth = yearlyTrend.reduce<{ name: string; net: number } | null>(
    (best, m) => (m.income || m.expense) && (!best || m.net > best.net) ? { name: m.name, net: m.net } : best,
    null,
  );

  const prevPeriod = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextPeriod = () => {
    if (isCurrent) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  const fmtCur = (v: number) => fmt(v, currency);
  const fmtAxis = (v: number) => fmt(v, currency).replace(/\.\d+/, '');

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <SectionHeader
        title="Review"
        subtitle="Your profit & loss, month by month"
        icon={LineChart}
        action={
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={prevPeriod} aria-label="Previous month" className="min-h-0 rounded-full p-2">
              <ChevronLeft size={18} />
            </Button>
            <Text as="span" className="min-w-24 text-center text-sm font-semibold tabular-nums">
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <Button variant="ghost" size="sm" onClick={nextPeriod} disabled={isCurrent} aria-label="Next month" className="min-h-0 rounded-full p-2">
              <ChevronRight size={18} />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <SkeletonCard className="h-44" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Monthly P&L hero */}
          <Card variant="gradient" className="overflow-hidden">
            <Text as="span" variant="small" className="uppercase tracking-wide text-[10px]">
              {MONTH_NAMES[month - 1]} {year} · net {net >= 0 ? 'profit' : 'loss'}
            </Text>
            <div className="mt-1 flex items-baseline gap-3">
              <Heading level={2} className={cn('tabular-nums', net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-500')}>
                {net >= 0 ? '+' : '-'}{fmtCur(Math.abs(net))}
              </Heading>
              {prevMonthly && (
                <Text as="span" variant="small" className={cn('tabular-nums font-medium', netDelta >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-500')}>
                  {netDelta >= 0 ? '▲' : '▼'} {fmtCur(Math.abs(netDelta))} vs last month
                </Text>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success">Income {fmtCur(income)}</Badge>
              <Badge variant="danger">Expense {fmtCur(expense)}</Badge>
              <Badge variant="brand">Savings rate {Math.round(savingsRate)}%</Badge>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Income" value={income} format={fmtCur} icon={TrendingUp} tone="success" />
            <StatCard label="Expense" value={expense} format={fmtCur} icon={TrendingDown} tone="danger" />
            <StatCard label="Savings Rate" value={savingsRate} format={(n) => `${Math.round(n)}%`} icon={PiggyBank} tone="aqua" />
          </div>

          {/* Top spending categories */}
          <Card>
            <Heading level={5} className="mb-3">Top spending</Heading>
            {topCategories.length === 0 ? (
              <Text variant="small" className="text-slate-400">No expenses recorded this month.</Text>
            ) : (
              <div className="space-y-2.5">
                {topCategories.map((c) => {
                  const share = expense > 0 ? Math.round((c.total / expense) * 100) : 0;
                  return (
                    <div key={c._id} className="flex items-center gap-3">
                      <Text as="span" className="text-base leading-none shrink-0">{c.category?.icon ?? '📦'}</Text>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <Text as="span" className="truncate text-sm">{c.category?.name ?? 'Uncategorised'}</Text>
                          <Text as="span" variant="small" className="tabular-nums shrink-0">{fmtCur(c.total)} · {share}%</Text>
                        </div>
                        <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-ink-700 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: c.category?.color ?? '#64748B' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Year in review */}
      <div className="space-y-4">
        <Heading level={5}>Year in review — {year}</Heading>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Income" value={yearIncome} format={fmtCur} icon={TrendingUp} tone="success" />
          <StatCard label="Expense" value={yearExpense} format={fmtCur} icon={TrendingDown} tone="danger" />
          <StatCard
            label={yearNet >= 0 ? 'Net profit' : 'Net loss'}
            value={Math.abs(yearNet)}
            format={(n) => `${yearNet >= 0 ? '+' : '-'}${fmtCur(n)}`}
            icon={PiggyBank}
            tone="brand"
            gradient
          />
          <StatCard label="Goals achieved" value={yearlyReport?.goalsAchieved ?? 0} format={(n) => `${Math.round(n)}`} icon={Trophy} tone="warn" />
        </div>

        <ChartCard
          title="Income vs Expense"
          subtitle={`Monthly totals across ${year}`}
          empty={yearlyTrend.every((m) => m.income === 0 && m.expense === 0)}
          emptyLabel="No activity recorded this year"
        >
          <AreaTrend
            data={yearlyTrend}
            xKey="name"
            height={260}
            series={[
              { key: 'income', label: 'Income', colorVar: 'var(--chart-4)' },
              { key: 'expense', label: 'Expense', colorVar: 'var(--chart-6)' },
            ]}
            formatValue={fmtCur}
            formatY={fmtAxis}
          />
        </ChartCard>

        {bestMonth && bestMonth.net > 0 && (
          <Text variant="small" className="text-slate-500">
            Best month: <Text as="span" className="font-semibold text-slate-700 dark:text-slate-200">{bestMonth.name}</Text> (net +{fmtCur(bestMonth.net)}).
          </Text>
        )}
      </div>
    </div>
  );
}
