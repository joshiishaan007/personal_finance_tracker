'use client';

import { useForm } from 'react-hook-form';
import { Wallet, TrendingDown, Save, LineChart as LineChartIcon, Lock } from 'lucide-react';
import { fmt } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNetWorth, useUpsertNetWorth } from '@/hooks/useNetWorth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { GradientText } from '@/components/ui/GradientText';
import { IconBadge } from '@/components/ui/IconBadge';
import { StatCard } from '@/components/StatCard';
import { ChartCard } from '@/components/charts/ChartCard';
import { AreaTrend } from '@/components/charts/AreaTrend';
import { Donut } from '@/components/charts/Donut';
import { format, parseISO } from 'date-fns';

type AssetForm = { cash: number; bank: number; property: number; vehicles: number; other: number };
type LiabilityForm = { loans: number; credit: number; other: number };
type FormValues = { assets: AssetForm; liabilities: LiabilityForm };

const toDisplay = (v: number) => v / 100;
const toMinor = (v: number) => Math.round(v * 100);

export function NetWorthView() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';

  const { data: snapshots } = useNetWorth();
  const latest = snapshots?.[0];

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      assets: {
        cash: toDisplay(latest?.assets.cash ?? 0),
        bank: toDisplay(latest?.assets.bank ?? 0),
        property: toDisplay(latest?.assets.property ?? 0),
        vehicles: toDisplay(latest?.assets.vehicles ?? 0),
        other: toDisplay(latest?.assets.other ?? 0),
      },
      liabilities: {
        loans: toDisplay(latest?.liabilities.loans ?? 0),
        credit: toDisplay(latest?.liabilities.credit ?? 0),
        other: toDisplay(latest?.liabilities.other ?? 0),
      },
    },
  });

  const save = useUpsertNetWorth();

  function onSubmit(values: FormValues) {
    save.mutate({
      assets: Object.fromEntries(Object.entries(values.assets).map(([k, v]) => [k, toMinor(v)])) as AssetForm,
      liabilities: Object.fromEntries(Object.entries(values.liabilities).map(([k, v]) => [k, toMinor(v)])) as LiabilityForm,
    });
  }

  const chartData = (snapshots ?? []).slice().reverse().map((s) => ({
    date: format(parseISO(s.date), 'MMM yy'),
    netWorth: s.netWorth / 100,
  }));

  const totalAssets = latest
    ? latest.assets.cash + latest.assets.bank + latest.assets.property + latest.assets.vehicles + latest.assets.other
    : 0;
  const totalLiabilities = latest
    ? latest.liabilities.loans + latest.liabilities.credit + latest.liabilities.other
    : 0;

  const donutData = [
    { name: 'Assets', value: totalAssets / 100 },
    { name: 'Liabilities', value: totalLiabilities / 100 },
  ];

  const netWorth = latest?.netWorth ?? 0;
  const netWorthPositive = netWorth >= 0;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Heading level={2}>Net Worth</Heading>
        <Badge variant={netWorthPositive ? 'success' : 'danger'}>
          {netWorthPositive ? 'Positive' : 'Negative'}
        </Badge>
      </div>

      <Card variant="gradient" className="flex flex-col items-center text-center py-8">
        <Text as="span" variant="small" className="uppercase tracking-wide text-[11px]">Current Net Worth</Text>
        <GradientText as="span" className="mt-1 text-3xl sm:text-4xl md:text-5xl tabular-nums">
          {fmt(netWorth, currency)}
        </GradientText>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Assets" value={totalAssets} format={(n) => fmt(n, currency)} icon={Wallet} tone="success" />
        <StatCard label="Total Liabilities" value={totalLiabilities} format={(n) => fmt(n, currency)} icon={TrendingDown} tone="danger" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ChartCard title="Net Worth Over Time" empty={chartData.length === 0} emptyLabel="Save a snapshot to start the trend">
          <AreaTrend
            data={chartData}
            xKey="date"
            series={[{ key: 'netWorth', label: 'Net Worth', colorVar: 'var(--chart-1)' }]}
            formatValue={(v) => fmt(Math.round(v * 100), currency)}
            formatY={(v) => `${Math.round(v / 1000)}k`}
          />
        </ChartCard>

        <ChartCard title="Assets vs Liabilities" empty={totalAssets === 0 && totalLiabilities === 0} emptyLabel="No snapshot yet">
          <Donut
            data={donutData}
            centerLabel="Net"
            centerValue={fmt(netWorth, currency)}
            formatValue={(v) => fmt(Math.round(v * 100), currency)}
          />
        </ChartCard>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card variant="glass">
            <div className="flex items-center gap-2 mb-4">
              <IconBadge icon={Wallet} tone="success" size="sm" />
              <Heading level={4}>Assets</Heading>
            </div>
            <div className="space-y-3">
              <Input label="Cash" type="number" step="0.01" {...register('assets.cash')} />
              <Input label="Bank Accounts" type="number" step="0.01" {...register('assets.bank')} />
              <Input label="Property" type="number" step="0.01" {...register('assets.property')} />
              <Input label="Vehicles" type="number" step="0.01" {...register('assets.vehicles')} />
              <Input label="Other Assets" type="number" step="0.01" {...register('assets.other')} />
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center gap-2 mb-4">
              <IconBadge icon={TrendingDown} tone="danger" size="sm" />
              <Heading level={4}>Liabilities</Heading>
            </div>
            <div className="space-y-3">
              <Input label="Loans" type="number" step="0.01" {...register('liabilities.loans')} />
              <Input label="Credit Cards" type="number" step="0.01" {...register('liabilities.credit')} />
              <Input label="Other Liabilities" type="number" step="0.01" {...register('liabilities.other')} />
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Button type="submit" loading={save.isPending} leftIcon={<Save size={16} strokeWidth={2.4} />} className="w-full sm:w-auto">
            Save Snapshot
          </Button>
        </div>
      </form>

      <Card variant="glass" className="opacity-70 border-dashed">
        <div className="flex items-center gap-3">
          <IconBadge icon={LineChartIcon} tone="accent" />
          <div className="min-w-0">
            <Heading level={5}>Investments &amp; Portfolio</Heading>
            <Text variant="muted">Stocks, mutual funds, dividends — coming in Phase 2</Text>
          </div>
          <Badge variant="default" className="ml-auto gap-1">
            <Lock size={11} strokeWidth={2.4} /> Phase 2
          </Badge>
        </div>
      </Card>
    </div>
  );
}
