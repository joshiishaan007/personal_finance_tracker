'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarRange, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useMonthlyAnalytics, useYearlyAnalytics, useCustomAnalytics,
} from '@/hooks/useAnalytics';
import { fmt, cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { StatCard } from '@/components/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { CalendarHeatmap } from '@/components/charts/CalendarHeatmap';
import { Donut, BarsGrouped, AreaTrend } from '@/components/charts/lazy';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type TabType = 'monthly' | 'yearly' | 'custom';

export function AnalyticsView() {
  const { user } = useAuth();
  const now = new Date();
  const [tab, setTab] = useState<TabType>('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyAnalytics(year, month, tab === 'monthly');
  const { data: yearlyData, isLoading: yearlyLoading } = useYearlyAnalytics(year, tab === 'yearly');
  const { data: customData } = useCustomAnalytics(customStart, customEnd, tab === 'custom');

  const currency = monthlyData?.currency ?? yearlyData?.currency ?? user?.currency ?? 'INR';
  const fmtCur = (n: number) => fmt(n, currency);

  const yearlyChartData = MONTH_NAMES.map((label, i) => {
    const m = i + 1;
    const inc = yearlyData?.monthly.find((d) => d._id.month === m && d._id.type === 'income')?.total ?? 0;
    const exp = yearlyData?.monthly.find((d) => d._id.month === m && d._id.type === 'expense')?.total ?? 0;
    return { label, income: inc, expense: exp };
  });

  const dailyDays = (monthlyData?.byDay ?? [])
    .filter((d) => d._id.type === 'expense')
    .map((d) => ({ day: d._id.day, value: d.total }));

  const monthlyCategoryData = (monthlyData?.byCategory ?? []).map((c) => ({ name: c.category.name, value: c.total }));

  const monthlyIncome = monthlyData?.summary.income ?? 0;
  const monthlyExpense = monthlyData?.summary.expense ?? 0;
  const monthlyNet = monthlyData?.summary.net ?? 0;

  const customIncome = (customData ?? []).filter((d) => d._id.type === 'income').reduce((s, d) => s + d.total, 0);
  const customExpense = (customData ?? []).filter((d) => d._id.type === 'expense').reduce((s, d) => s + d.total, 0);
  const customBars = [{ label: 'Range', income: customIncome, expense: customExpense }];

  const tabs: { id: TabType; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom Range' },
  ];

  function prev() {
    if (tab === 'monthly') {
      if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
    } else setYear((y) => y - 1);
  }
  function next() {
    if (tab === 'monthly') {
      if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
    } else setYear((y) => y + 1);
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <Heading level={2}>Analytics</Heading>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex gap-1 p-1 bg-slate-100 dark:bg-ink-800 rounded-2xl">
          {tabs.map((t) => (
            <Button
              key={t.id}
              variant="ghost"
              size="sm"
              onClick={() => setTab(t.id)}
              className={cn(
                'min-h-0 px-4 py-2 rounded-xl',
                tab === t.id
                  ? 'bg-white dark:bg-ink-900 text-brand-700 dark:text-brand-300 shadow-card'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {tab !== 'custom' && (
          <div className="inline-flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={prev} className="min-h-0 p-2 rounded-xl" aria-label="Previous period">
              <ChevronLeft size={18} />
            </Button>
            <Text as="span" className="font-display font-semibold min-w-20 sm:min-w-32 text-center tabular-nums">
              {tab === 'monthly' ? `${MONTH_NAMES[month - 1]} ${year}` : year}
            </Text>
            <Button variant="ghost" size="sm" onClick={next} className="min-h-0 p-2 rounded-xl" aria-label="Next period">
              <ChevronRight size={18} />
            </Button>
          </div>
        )}
      </div>

      {tab === 'custom' && (
        <Card variant="glass" padding="sm">
          <div className="flex flex-wrap items-center gap-3">
            <CalendarRange size={18} className="text-brand-500" />
            <DatePicker value={customStart} onChange={setCustomStart} placeholder="Start date" />
            <Text as="span" variant="muted" className="self-center">to</Text>
            <DatePicker value={customEnd} onChange={setCustomEnd} placeholder="End date" />
          </div>
        </Card>
      )}

      {tab === 'monthly' && !monthlyLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Income" value={monthlyIncome} format={fmtCur} icon={TrendingUp} tone="success" />
            <StatCard label="Expense" value={monthlyExpense} format={fmtCur} icon={TrendingDown} tone="danger" />
            <StatCard label="Net" value={monthlyNet} format={fmtCur} icon={Scale} tone="brand" gradient />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <ChartCard
              title="Daily Spending"
              subtitle="Heatmap of expenses"
              empty={dailyDays.length === 0}
              emptyLabel="No spending this month"
            >
              <div className="px-2 pb-1">
                <CalendarHeatmap days={dailyDays} month={month} year={year} formatValue={fmtCur} />
              </div>
            </ChartCard>

            <ChartCard
              title="Expense by Category"
              empty={monthlyCategoryData.length === 0}
              emptyLabel="No expenses this month"
            >
              <Donut
                data={monthlyCategoryData}
                centerLabel="Spent"
                centerValue={fmtCur(monthlyExpense)}
                formatValue={fmtCur}
              />
            </ChartCard>
          </div>
        </div>
      )}

      {tab === 'yearly' && !yearlyLoading && (
        <ChartCard
          title="12-Month Trend"
          subtitle={String(year)}
          empty={yearlyChartData.every((d) => d.income === 0 && d.expense === 0)}
          emptyLabel="No data this year"
        >
          <AreaTrend
            data={yearlyChartData}
            xKey="label"
            height={300}
            series={[
              { key: 'income', label: 'Income', colorVar: 'var(--chart-4)' },
              { key: 'expense', label: 'Expense', colorVar: 'var(--chart-6)' },
            ]}
            formatValue={fmtCur}
            formatY={(v) => `${Math.round(v / 100)}`}
          />
        </ChartCard>
      )}

      {tab === 'custom' && customData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Income" value={customIncome} format={fmtCur} icon={TrendingUp} tone="success" />
            <StatCard label="Expense" value={customExpense} format={fmtCur} icon={TrendingDown} tone="danger" />
            <StatCard label="Net" value={customIncome - customExpense} format={fmtCur} icon={Scale} tone="brand" gradient />
          </div>

          <ChartCard
            title="Income vs Expense"
            subtitle="Selected range"
            empty={customIncome === 0 && customExpense === 0}
            emptyLabel="No data for this range"
          >
            <BarsGrouped
              data={customBars}
              xKey="label"
              series={[
                { key: 'income', label: 'Income', colorVar: 'var(--chart-4)' },
                { key: 'expense', label: 'Expense', colorVar: 'var(--chart-6)' },
              ]}
              formatValue={fmtCur}
              formatY={(v) => `${Math.round(v / 100)}`}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
