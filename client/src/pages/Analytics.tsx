import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { fmt } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type TabType = 'monthly' | 'yearly' | 'custom';

export function Analytics() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const now = new Date();
  const [tab, setTab] = useState<TabType>('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['analytics', 'monthly', year, month],
    queryFn: () =>
      api.get<{ data: { totals: Array<{ _id: string; total: number }>; byCategory: Array<{ _id: string; total: number; category: { name: string; color: string; icon: string } }>; byDay: Array<{ _id: { day: number; type: string }; total: number }> } }>(
        `/api/analytics/monthly?year=${year}&month=${month}`
      ).then((r) => r.data.data),
    enabled: tab === 'monthly',
  });

  const { data: yearlyData, isLoading: yearlyLoading } = useQuery({
    queryKey: ['analytics', 'yearly', year],
    queryFn: () =>
      api.get<{ data: { monthly: Array<{ _id: { month: number; type: string }; total: number }> } }>(
        `/api/analytics/yearly?year=${year}`
      ).then((r) => r.data.data),
    enabled: tab === 'yearly',
  });

  const { data: customData } = useQuery({
    queryKey: ['analytics', 'custom', customStart, customEnd],
    queryFn: () =>
      api.get<{ data: Array<{ _id: { type: string }; total: number; category?: { name: string } }> }>(
        `/api/analytics/custom?startDate=${new Date(customStart).toISOString()}&endDate=${new Date(customEnd).toISOString()}`
      ).then((r) => r.data.data),
    enabled: tab === 'custom' && !!customStart && !!customEnd,
  });

  // Build yearly chart data
  const yearlyChartData = MONTH_NAMES.map((label, i) => {
    const m = i + 1;
    const inc = yearlyData?.monthly.find((d) => d._id.month === m && d._id.type === 'income')?.total ?? 0;
    const exp = yearlyData?.monthly.find((d) => d._id.month === m && d._id.type === 'expense')?.total ?? 0;
    return { label, income: inc, expense: exp };
  });

  const tabs: { id: TabType; label: string }[] = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-slate-950 text-brand-700 dark:text-brand-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      {tab !== 'custom' && (
        <div className="flex items-center gap-3">
          <button onClick={() => { if (tab === 'monthly') { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); } else setYear((y) => y - 1); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">←</button>
          <span className="font-semibold min-w-32 text-center">
            {tab === 'monthly' ? `${MONTH_NAMES[month - 1]} ${year}` : year}
          </span>
          <button onClick={() => { if (tab === 'monthly') { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); } else setYear((y) => y + 1); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">→</button>
        </div>
      )}

      {tab === 'custom' && (
        <Card padding="sm" className="flex flex-wrap gap-3 p-3">
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
          <span className="self-center text-slate-400">to</span>
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900" />
        </Card>
      )}

      {/* Monthly charts */}
      {tab === 'monthly' && !monthlyLoading && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card padding="sm">
            <h2 className="text-sm font-semibold px-3 pt-2 pb-3">Daily Spending Heatmap</h2>
            {(monthlyData?.byDay ?? []).length === 0 ? (
              <EmptyState icon="📅" title="No data this month" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData?.byDay.filter((d) => d._id.type === 'expense').map((d) => ({ day: d._id.day, amount: d.total })) ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${Math.round(v / 100)}`} />
                  <Tooltip formatter={(v: number) => fmt(v, currency)} />
                  <Bar dataKey="amount" fill="#6366F1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card padding="sm">
            <h2 className="text-sm font-semibold px-3 pt-2 pb-3">Expense by Category</h2>
            {(monthlyData?.byCategory ?? []).length === 0 ? (
              <EmptyState icon="🍩" title="No expenses this month" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={monthlyData?.byCategory ?? []} dataKey="total" nameKey="category.name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                    {(monthlyData?.byCategory ?? []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v, currency)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h2 className="text-sm font-semibold mb-3">Summary</h2>
            <div className="space-y-2">
              {(monthlyData?.totals ?? []).map((t) => (
                <div key={t._id} className="flex justify-between text-sm">
                  <span className="capitalize text-slate-600 dark:text-slate-400">{t._id}</span>
                  <span className="font-semibold">{fmt(t.total, currency)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Yearly charts */}
      {tab === 'yearly' && !yearlyLoading && (
        <Card padding="sm">
          <h2 className="text-sm font-semibold px-3 pt-2 pb-3">12-Month Trend — {year}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={yearlyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 100)}`} />
              <Tooltip formatter={(v: number) => fmt(v, currency)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} dot={false} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Custom range */}
      {tab === 'custom' && customData && (
        <Card>
          <h2 className="text-sm font-semibold mb-3">Summary for Selected Range</h2>
          <div className="space-y-2">
            {customData.map((d, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="capitalize text-slate-600 dark:text-slate-400">{d._id.type}</span>
                <span className="font-semibold">{fmt(d.total, currency)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
