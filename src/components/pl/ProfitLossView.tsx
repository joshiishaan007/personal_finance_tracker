'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Wallet, Scale, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfitLoss } from '@/hooks/useProfitLoss';
import { fmt } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { BarsGrouped } from '@/components/charts/lazy';
import { SkeletonCard } from '@/components/SkeletonLoader';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function ProfitLossView() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useProfitLoss(year, month);

  const currency = data?.currency ?? user?.currency ?? 'INR';

  const budgetMap = Object.fromEntries(
    (data?.budgets ?? []).map((b) => {
      const catId = typeof b.categoryId === 'object' ? b.categoryId._id : b.categoryId;
      return [catId, b.amount];
    }),
  );

  const expenseRows = (data?.actual ?? []).filter((a) => a._id.type === 'expense');
  const incomeRows = (data?.actual ?? []).filter((a) => a._id.type === 'income');

  const chartData = expenseRows.map((row) => ({
    name: row.category?.name ?? 'Other',
    actual: row.actual,
    budget: budgetMap[row._id.categoryId] ?? 0,
  }));

  const totalIncome = incomeRows.reduce((s, r) => s + r.actual, 0);
  const totalActual = expenseRows.reduce((s, r) => s + r.actual, 0);
  const totalBudget = expenseRows.reduce((s, r) => s + (budgetMap[r._id.categoryId] ?? 0), 0);
  const varianceVal = totalBudget - totalActual;
  const underBudget = varianceVal >= 0;

  const prevPeriod = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextPeriod = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  const formatCurrency = (v: number) => fmt(v, currency);
  const formatAxis = (v: number) => fmt(v, currency).replace(/\.\d+/, '');

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      <SectionHeader
        title="Profit & Loss"
        subtitle="Actual spending vs your budget"
        icon={Scale}
        action={
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={prevPeriod} aria-label="Previous month" className="min-h-0 rounded-full p-2">
              <ChevronLeft size={18} />
            </Button>
            <Text as="span" className="min-w-20 sm:min-w-28 text-center text-sm font-semibold tabular-nums">
              {MONTH_NAMES[month - 1].slice(0, 3)} {year}
            </Text>
            <Button variant="ghost" size="sm" onClick={nextPeriod} aria-label="Next month" className="min-h-0 rounded-full p-2">
              <ChevronRight size={18} />
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
          <SkeletonCard className="h-72" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Actual" value={totalActual} format={formatCurrency} icon={Receipt} tone="accent" />
            <StatCard label="Total Budget" value={totalBudget} format={formatCurrency} icon={Wallet} tone="aqua" />
            <StatCard
              label="Variance"
              value={Math.abs(varianceVal)}
              format={formatCurrency}
              icon={TrendingUp}
              tone={underBudget ? 'success' : 'danger'}
              gradient
              delta={totalBudget > 0 ? { value: Math.round((varianceVal / totalBudget) * 100), label: underBudget ? 'under' : 'over' } : undefined}
            />
          </div>

          <ChartCard
            title="Actual vs Budget"
            subtitle="By expense category"
            empty={chartData.length === 0}
            emptyLabel="No expense data for this period"
            action={<Text as="span" variant="small" className="tabular-nums">Income {fmt(totalIncome, currency)}</Text>}
          >
            <BarsGrouped
              data={chartData}
              xKey="name"
              height={300}
              series={[
                { key: 'actual', label: 'Actual', colorVar: 'var(--chart-1)' },
                { key: 'budget', label: 'Budget', colorVar: 'var(--chart-3)' },
              ]}
              formatValue={formatCurrency}
              formatY={formatAxis}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
