import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { api } from '../lib/api';
import { fmt } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/EmptyState';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface Snapshot {
  _id: string;
  date: string;
  assets: { cash: number; bank: number; property: number; vehicles: number; other: number };
  liabilities: { loans: number; credit: number; other: number };
  netWorth: number;
}

type AssetForm = { cash: number; bank: number; property: number; vehicles: number; other: number };
type LiabilityForm = { loans: number; credit: number; other: number };
type FormValues = { assets: AssetForm; liabilities: LiabilityForm };

const toDisplay = (v: number) => v / 100;
const toMinor = (v: number) => Math.round(v * 100);

export function NetWorth() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const currency = user?.currency ?? 'INR';

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['net-worth'],
    queryFn: () => api.get<{ data: Snapshot[] }>('/api/net-worth').then((r) => r.data.data),
  });

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

  const save = useMutation({
    mutationFn: (values: FormValues) =>
      api.post('/api/net-worth', {
        assets: Object.fromEntries(Object.entries(values.assets).map(([k, v]) => [k, toMinor(v)])),
        liabilities: Object.fromEntries(Object.entries(values.liabilities).map(([k, v]) => [k, toMinor(v)])),
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['net-worth'] }),
  });

  const chartData = (snapshots ?? []).slice().reverse().map((s) => ({
    date: format(parseISO(s.date), 'MMM yy'),
    netWorth: s.netWorth / 100,
  }));

  const netWorthPositive = (latest?.netWorth ?? 0) >= 0;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Net Worth</h1>
        <Badge variant={netWorthPositive ? 'success' : 'danger'}>
          {fmt(latest?.netWorth ?? 0, currency)}
        </Badge>
      </div>

      {/* Trend chart */}
      {chartData.length > 0 && (
        <Card padding="sm">
          <h2 className="text-sm font-semibold px-3 pt-2 pb-3">Net Worth Over Time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(Math.round(v * 100), currency)} />
              <Line type="monotone" dataKey="netWorth" stroke="#6366F1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit((v) => save.mutate(v))}>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="font-semibold mb-4">Assets 💰</h2>
            <div className="space-y-3">
              <Input label="Cash" type="number" step="0.01" {...register('assets.cash')} />
              <Input label="Bank Accounts" type="number" step="0.01" {...register('assets.bank')} />
              <Input label="Property" type="number" step="0.01" {...register('assets.property')} />
              <Input label="Vehicles" type="number" step="0.01" {...register('assets.vehicles')} />
              <Input label="Other Assets" type="number" step="0.01" {...register('assets.other')} />
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold mb-4">Liabilities 📉</h2>
            <div className="space-y-3">
              <Input label="Loans" type="number" step="0.01" {...register('liabilities.loans')} />
              <Input label="Credit Cards" type="number" step="0.01" {...register('liabilities.credit')} />
              <Input label="Other Liabilities" type="number" step="0.01" {...register('liabilities.other')} />
            </div>
          </Card>
        </div>

        <div className="mt-4">
          <Button type="submit" loading={save.isPending} className="w-full sm:w-auto">
            💾 Save Snapshot
          </Button>
        </div>
      </form>

      {/* Phase 2 placeholder */}
      <Card className="opacity-60 border-dashed">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <div>
            <h3 className="font-medium">Investments & Portfolio</h3>
            <p className="text-sm text-slate-500">Stocks, mutual funds, dividends — coming in Phase 2</p>
          </div>
          <Badge variant="default" className="ml-auto">Phase 2</Badge>
        </div>
      </Card>
    </div>
  );
}
