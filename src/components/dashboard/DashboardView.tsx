'use client';

import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank, Target, CalendarClock,
  Sunrise, Sun, Moon, Sprout, Repeat, LineChart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useAnalytics';
import { useRecurring } from '@/hooks/useRecurring';
import { useGoals } from '@/hooks/useGoals';
import { useBalance } from '@/hooks/useBalance';
import { useInvestments } from '@/hooks/useInvestments';
import { fmt, fmtDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Link } from '@/components/ui/Link';
import { GradientText } from '@/components/ui/GradientText';
import { IconBadge } from '@/components/ui/IconBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { SectionHeader } from '@/components/SectionHeader';
import { StatCard } from '@/components/StatCard';
import { QuickAddBar } from '@/components/transaction/QuickAddBar';
import { InstantCards } from '@/components/transaction/InstantCards';
import { StreakBadge } from '@/components/engagement/StreakBadge';
import { EndOfDayCard } from '@/components/engagement/EndOfDayCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { AreaTrend, Donut, GaugeRadial } from '@/components/charts/lazy';
import type { LucideIcon } from 'lucide-react';

const QUOTES: string[] = [
  'A budget is telling your money where to go instead of wondering where it went. — Dave Ramsey',
  'Do not save what is left after spending; instead spend what is left after saving. — Warren Buffett',
  'An investment in knowledge pays the best interest. — Benjamin Franklin',
  'The stock market is a device for transferring money from the impatient to the patient. — Warren Buffett',
  'Financial freedom is available to those who learn about it and work for it. — Robert Kiyosaki',
  'The habit of saving is itself an education; it fosters every virtue, teaches self-denial. — T.T. Munger',
  "Rich people stay rich by living like they're broke. Broke people stay broke by living like they're rich.",
  "Wealth is not about having a lot of money; it's about having a lot of options. — Chris Rock",
  "It is not your salary that makes you rich, it's your spending habits. — Charles A. Jaffe",
  'Money is only a tool. It will take you wherever you wish. — Ayn Rand',
  "Every time you borrow money, you're robbing your future self. — Nathan W. Morris",
  'A penny saved is a penny earned. — Benjamin Franklin',
  "Too many people spend money they haven't earned to buy things they don't want. — Will Rogers",
  'Beware of little expenses. A small leak will sink a great ship. — Benjamin Franklin',
  'The art is not in making money, but in keeping it. — Proverb',
  'You must gain control over your money or the lack of it will forever control you. — Dave Ramsey',
  'The secret to wealth is simple: find a way to do more for others than anyone else does. — Tony Robbins',
  'Wealth consists not in having great possessions, but in having few wants. — Epictetus',
  'The greatest wealth is to live content with little. — Plato',
  'Money grows on the tree of persistence. — Japanese Proverb',
  'Compound interest is the eighth wonder of the world. — Albert Einstein',
  'Never spend your money before you have it. — Thomas Jefferson',
  "Financial peace isn't the acquisition of stuff. It's learning to live on less. — Dave Ramsey",
  'The quickest way to double your money is to fold it in half and put it in your back pocket. — Will Rogers',
  'Making money is a happiness. Making other people happy is a super-happiness. — Nobel Peace Prize winner',
  'Opportunity is missed by most people because it is dressed in overalls and looks like work. — Thomas Edison',
  'Success is not the key to happiness. Happiness is the key to success. — Albert Schweitzer',
  "Small steps every day. That's how the mountain is climbed.",
  'Every financial decision today is a gift or burden to your future self.',
  'Your net worth is not your self worth — but taking care of one helps the other.',
];

function getDailyQuote(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length] ?? QUOTES[0]!;
}

interface Greeting {
  text: string;
  icon: LucideIcon;
}

function getGreeting(name: string): Greeting {
  const first = name.split(' ')[0];
  const hour = new Date().getHours();
  const day = new Date().getDate();
  if (day <= 3) return { text: `New month, fresh start, ${first}!`, icon: Sprout };
  if (hour < 12) return { text: `Good morning, ${first}!`, icon: Sunrise };
  if (hour < 17) return { text: `Good afternoon, ${first}!`, icon: Sun };
  return { text: `Good evening, ${first}!`, icon: Moon };
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Full-layout placeholder shown until every data query feeding the dashboard has
// resolved, so the real content appears fully populated in one pass instead of
// filling in section by section. Heights mirror the real cards to avoid layout shift.
function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton rounded-2xl h-32" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="skeleton rounded-2xl h-[316px]" />
        <div className="skeleton rounded-2xl h-[316px]" />
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton rounded-2xl h-56" />)}
      </div>
    </>
  );
}

export function DashboardView() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: dash, isLoading: dashLoading } = useDashboard();
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const { data: recurring, isLoading: recurringLoading } = useRecurring();
  const { data: balance, isLoading: balanceLoading } = useBalance();
  const { data: investments } = useInvestments();

  // Gate the whole data region on the three queries that feed it, so the user
  // never sees half-filled cards (zeros, "No goals yet") flash before the real
  // values arrive. On a cached return visit all three are false -> instant render.
  const loading = dashLoading || goalsLoading || recurringLoading || balanceLoading;

  const currency = dash?.currency ?? user?.currency ?? 'INR';
  const income = dash?.summary.income ?? 0;
  const expense = dash?.summary.expense ?? 0;
  const net = dash?.summary.net ?? income - expense;
  const savingsRate = dash?.summary.savingsRate ?? 0;

  const sixMonthMap: Record<string, { income: number; expense: number; label: string }> = {};
  for (const d of dash?.sixMonth ?? []) {
    const key = `${d._id.year}-${d._id.month}`;
    if (!sixMonthMap[key]) sixMonthMap[key] = { income: 0, expense: 0, label: MONTH_NAMES[d._id.month - 1] ?? '' };
    if (d._id.type === 'income') sixMonthMap[key]!.income = d.total;
    if (d._id.type === 'expense') sixMonthMap[key]!.expense = d.total;
  }
  const sixMonthData = Object.values(sixMonthMap);

  const incomeSpark = sixMonthData.map((d) => d.income);
  const expenseSpark = sixMonthData.map((d) => d.expense);
  const netSpark = sixMonthData.map((d) => d.income - d.expense);

  const categoryData = (dash?.topCategories ?? []).map((c) => ({ name: c.category.name, value: c.total }));

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const upcoming = (recurring ?? []).filter((r) => {
    const d = new Date(r.nextDueDate);
    return d >= now && d <= in7;
  });

  const activeGoals = (goals ?? []).filter((g) => g.status === 'active');

  const fmtCur = (n: number) => fmt(n, currency);
  const greeting = user ? getGreeting(user.name) : { text: 'Welcome!', icon: Sunrise };

  const invList = investments ?? [];
  const totalInvested  = invList.reduce((s, i) => s + (i.kind === 'fd' || i.kind === 'equity' ? i.totalContribution : i.investedAmount), 0);
  const totalProjected = invList.reduce((s, i) => s + i.projectedValue, 0);
  const totalReturn    = invList.reduce((s, i) => s + i.expectedReturn, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <Card variant="gradient" className="animate-fade-in">
        <div className="flex items-start gap-3">
          <IconBadge icon={greeting.icon} gradient size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
              <div className="flex-1 min-w-0">
                <Heading level={2}>
                  <GradientText>{greeting.text}</GradientText>
                </Heading>
              </div>
              <StreakBadge className="shrink-0" />
            </div>
            <Text variant="small" className="mt-1 italic">&quot;{getDailyQuote()}&quot;</Text>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <QuickAddBar />
        <InstantCards />
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
        <StatCard
          label="Total Balance"
          value={balance?.total ?? 0}
          format={fmtCur}
          icon={Wallet}
          tone="brand"
          gradient
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="MTD Income"
            value={income}
            format={fmtCur}
            icon={TrendingUp}
            tone="success"
            spark={incomeSpark.length > 1 ? incomeSpark : undefined}
          />
          <StatCard
            label="MTD Expense"
            value={expense}
            format={fmtCur}
            icon={TrendingDown}
            tone="danger"
            spark={expenseSpark.length > 1 ? expenseSpark : undefined}
          />
          <StatCard
            label="Net Savings"
            value={net}
            format={fmtCur}
            icon={Wallet}
            tone="brand"
            gradient
            spark={netSpark.length > 1 ? netSpark : undefined}
          />
          <StatCard
            label="Savings Rate"
            value={savingsRate}
            format={(n) => `${Math.round(n)}%`}
            icon={PiggyBank}
            tone="aqua"
          />
        </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard
          title="Income vs Expense"
          subtitle="Last 6 months"
          empty={sixMonthData.length === 0}
          emptyLabel="Add transactions to see your trends"
        >
          <AreaTrend
            data={sixMonthData}
            xKey="label"
            series={[
              { key: 'income', label: 'Income', colorVar: 'var(--chart-4)' },
              { key: 'expense', label: 'Expense', colorVar: 'var(--chart-6)' },
            ]}
            formatValue={fmtCur}
            formatY={(v) => `${Math.round(v / 100)}`}
          />
        </ChartCard>

        <ChartCard
          title="Expense by Category"
          subtitle="This month"
          empty={categoryData.length === 0}
          emptyLabel="Add transactions to see breakdown"
        >
          <Donut
            data={categoryData}
            centerLabel="Spent"
            centerValue={fmtCur(expense)}
            formatValue={fmtCur}
          />
        </ChartCard>
      </div>

      {/* Investment stats — only when user has investments */}
      {invList.length > 0 && (
        <div>
          <SectionHeader
            title="Investments"
            icon={LineChart}
            action={<Link href="/investments" className="text-xs">View all</Link>}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <StatCard label="Total Invested"  value={totalInvested}  format={fmtCur} icon={Wallet}    tone="brand"   />
            <StatCard label="Projected Value" value={totalProjected} format={fmtCur} icon={TrendingUp} tone="success" />
            <StatCard
              label="Expected Return"
              value={Math.abs(totalReturn)}
              format={(n) => `${totalReturn >= 0 ? '+' : '-'}${fmtCur(n)}`}
              icon={PiggyBank}
              tone={totalReturn >= 0 ? 'aqua' : 'danger'}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <SectionHeader
            title="Savings Rate"
            subtitle="Share of income kept"
            icon={PiggyBank}
          />
          <div className="mt-2">
            <GaugeRadial value={savingsRate} suffix="%" label="of income saved" colorVar="var(--chart-3)" />
          </div>
        </Card>

        <Card>
          <SectionHeader
            title="Active Goals"
            icon={Target}
            action={<Link href="/savings" className="text-xs">View all</Link>}
          />
          <div className="mt-4">
            {activeGoals.length === 0 ? (
              <EmptyState icon={Target} title="No goals yet" action={{ label: 'Add goal', onClick: () => router.push('/savings') }} />
            ) : (
              <div className="space-y-3">
                {activeGoals.slice(0, 3).map((goal) => {
                  const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                  return (
                    <div key={goal._id} className="flex items-center gap-3">
                      <ProgressRing pct={pct} size={48} color={goal.color} />
                      <div className="flex-1 min-w-0">
                        <Text className="text-sm font-medium truncate">{goal.icon} {goal.title}</Text>
                        <Text variant="small" className="tabular-nums">{fmt(goal.savedAmount, currency)} / {fmt(goal.targetAmount, currency)}</Text>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card variant="glass">
          <SectionHeader
            title="Upcoming"
            subtitle="Next 7 days"
            icon={CalendarClock}
            action={<Link href="/recurring" className="text-xs">Manage</Link>}
          />
          <div className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState icon={Repeat} title="Nothing upcoming" description="No recurring transactions due soon" />
            ) : (
              <div className="space-y-3">
                {upcoming.map((r) => (
                  <div key={r._id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Text className="text-sm font-medium truncate">{r.templateTransaction.note ?? 'Recurring'}</Text>
                      <Text variant="small">{fmtDate(r.nextDueDate)}</Text>
                    </div>
                    <Text
                      as="span"
                      className={`shrink-0 text-sm font-semibold tabular-nums ${r.templateTransaction.type === 'income' ? 'text-success-600 dark:text-success-300' : 'text-danger-600 dark:text-danger-300'}`}
                    >
                      {fmt(r.templateTransaction.amount, currency)}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <EndOfDayCard />
        </>
      )}
    </div>
  );
}
