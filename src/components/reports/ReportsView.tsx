'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Award, PiggyBank, Target, Wallet, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMonthlyReport, useYearlyReport } from '@/hooks/useReports';
import { fmt } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Heading } from '@/components/ui/Heading';
import { GradientText } from '@/components/ui/GradientText';
import { Badge } from '@/components/ui/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { GaugeRadial, AreaTrend } from '@/components/charts/lazy';
import { SkeletonCard } from '@/components/SkeletonLoader';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Gauge accent shifts with grade band so the hero color matches performance.
function gradeColorVar(grade: string): string {
  switch (grade) {
    case 'A': return 'var(--chart-4)';
    case 'B': return 'var(--chart-1)';
    case 'C': return 'var(--chart-5)';
    case 'D': return 'var(--chart-5)';
    default: return 'var(--chart-6)';
  }
}

export function ReportsView() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: monthly, isLoading: monthlyLoading } = useMonthlyReport(year, month);
  const { data: yearly } = useYearlyReport(year);

  const incomeByMonth = new Map<number, number>();
  const expenseByMonth = new Map<number, number>();
  for (const m of yearly?.monthly ?? []) {
    const map = m._id.type === 'income' ? incomeByMonth : expenseByMonth;
    map.set(m._id.month, (map.get(m._id.month) ?? 0) + m.total);
  }
  const yearlyTrend = MONTH_NAMES.map((name, i) => ({
    name,
    income: incomeByMonth.get(i + 1) ?? 0,
    expense: expenseByMonth.get(i + 1) ?? 0,
  }));

  const prevPeriod = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1);
  };
  const nextPeriod = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1);
  };

  const formatCurrency = (v: number) => fmt(v, currency);
  const formatAxis = (v: number) => fmt(v, currency).replace(/\.\d+/, '');
  const pct = (n: number) => `${Math.round(n)}%`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <SectionHeader
        title="Reports"
        subtitle="Your monthly report card and year in review"
        icon={Award}
        action={
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={prevPeriod} aria-label="Previous month" className="min-h-0 rounded-full p-2">
              <ChevronLeft size={18} />
            </Button>
            <Text as="span" className="min-w-24 text-center text-sm font-semibold tabular-nums">
              {MONTH_NAMES[month - 1]} {year}
            </Text>
            <Button variant="ghost" size="sm" onClick={nextPeriod} aria-label="Next month" className="min-h-0 rounded-full p-2">
              <ChevronRight size={18} />
            </Button>
          </div>
        }
      />

      {monthlyLoading ? (
        <div className="space-y-6">
          <SkeletonCard className="h-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        </div>
      ) : monthly && (
        <div className="space-y-6">
          <Card variant="gradient" className="overflow-hidden">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="relative w-full max-w-[220px] shrink-0">
                <GaugeRadial
                  value={monthly.composite}
                  max={100}
                  label="Overall score"
                  colorVar={gradeColorVar(monthly.grade)}
                  suffix=""
                  height={200}
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <Text as="span" variant="small" className="uppercase tracking-wide text-[10px]">
                  {MONTH_NAMES[month - 1]} {year} grade
                </Text>
                <div className="leading-none">
                  <GradientText className="text-6xl sm:text-7xl">{monthly.grade}</GradientText>
                </div>
                <Text variant="muted" className="mt-3 max-w-sm text-sm">
                  Savings rate (40%) + Budget adherence (40%) + Goal progress (20%).
                  A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F &lt; 60.
                </Text>
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge variant="success">Income {fmt(monthly.income, currency)}</Badge>
                  <Badge variant="danger">Expense {fmt(monthly.expense, currency)}</Badge>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Savings Score"
              value={monthly.savingsScore}
              format={pct}
              icon={PiggyBank}
              tone="success"
              delta={{ value: Math.round(monthly.savingsRate), label: 'rate' }}
            />
            <StatCard label="Budget Adherence" value={monthly.budgetScore} format={pct} icon={Wallet} tone="brand" />
            <StatCard label="Goal Progress" value={monthly.goalScore} format={pct} icon={Target} tone="accent" />
          </div>
        </div>
      )}

      {yearly && (
        <div className="space-y-4">
          <Heading level={5}>Year in Review — {year}</Heading>
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
              formatValue={formatCurrency}
              formatY={formatAxis}
            />
          </ChartCard>

          <StatCard
            label="Goals Achieved"
            value={yearly.goalsAchieved}
            format={(n) => `${Math.round(n)}`}
            icon={Trophy}
            tone="warn"
            gradient
          />
        </div>
      )}
    </div>
  );
}
