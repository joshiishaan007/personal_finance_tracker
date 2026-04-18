import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { fmt, fmtDate, calcSavingsRate } from '../lib/utils';
import { getDailyQuote } from '../quotes';
import { Card } from '../components/ui/Card';
import { SkeletonCard } from '../components/SkeletonLoader';
import { AIInsightCard } from '../components/AIInsightCard';
import { ProgressRing } from '../components/ProgressRing';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const CHART_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const day = new Date().getDate();
  if (day <= 3) return `New month, fresh start, ${name.split(' ')[0]}! 🌱`;
  if (hour < 12) return `Good morning, ${name.split(' ')[0]}! ☀️`;
  if (hour < 17) return `Good afternoon, ${name.split(' ')[0]}! 👋`;
  return `Good evening, ${name.split(' ')[0]}! 🌙`;
}

interface DashboardData {
  mtd: Array<{ _id: string; total: number }>;
  sixMonth: Array<{ _id: { month: number; year: number; type: string }; total: number }>;
  topCategories: Array<{ _id: string; total: number; category: { name: string; icon: string; color: string } }>;
}

interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  color: string;
  icon: string;
}

interface RecurringRule {
  _id: string;
  templateTransaction: { amount: number; type: string; note?: string };
  frequency: string;
  nextDueDate: string;
}

interface AIInsightData {
  insights: Array<{ type: string; title: string; body: string; why: string; dataPoints: Record<string, number> }>;
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dash, isLoading: dashLoading } = useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => api.get<{ data: DashboardData }>('/api/analytics/dashboard').then((r) => r.data.data),
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get<{ data: Goal[] }>('/api/goals').then((r) => r.data.data),
  });

  const { data: recurring } = useQuery({
    queryKey: ['recurring'],
    queryFn: () => api.get<{ data: RecurringRule[] }>('/api/recurring').then((r) => r.data.data),
  });

  const { data: aiData } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => api.get<{ data: AIInsightData | null }>('/api/ai/insights').then((r) => r.data.data),
    retry: false,
    staleTime: 1000 * 60 * 60,
  });

  const currency = user?.currency ?? 'INR';
  const income = dash?.mtd.find((t) => t._id === 'income')?.total ?? 0;
  const expense = dash?.mtd.find((t) => t._id === 'expense')?.total ?? 0;
  const net = income - expense;
  const savingsRate = calcSavingsRate(income, expense);

  // Build 6-month chart data
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sixMonthMap: Record<string, { income: number; expense: number; label: string }> = {};
  for (const d of dash?.sixMonth ?? []) {
    const key = `${d._id.year}-${d._id.month}`;
    if (!sixMonthMap[key]) sixMonthMap[key] = { income: 0, expense: 0, label: monthNames[d._id.month - 1] ?? '' };
    if (d._id.type === 'income') sixMonthMap[key]!.income = d.total;
    if (d._id.type === 'expense') sixMonthMap[key]!.expense = d.total;
  }
  const sixMonthData = Object.values(sixMonthMap);

  // Upcoming recurring (next 7 days)
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const upcoming = (recurring ?? []).filter((r) => {
    const d = new Date(r.nextDueDate);
    return d >= now && d <= in7;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Greeting + quote */}
      <div>
        <h1 className="text-2xl font-bold">{user ? getGreeting(user.name) : 'Welcome!'}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">"{getDailyQuote()}"</p>
      </div>

      {/* MTD summary cards */}
      {dashLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-slate-500 font-medium">MTD Income</p>
            <p className="text-xl font-bold text-success-500 mt-1">{fmt(income, currency)}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 font-medium">MTD Expense</p>
            <p className="text-xl font-bold text-danger-500 mt-1">{fmt(expense, currency)}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 font-medium">Net Savings</p>
            <p className={`text-xl font-bold mt-1 ${net >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
              {fmt(Math.abs(net), currency)}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500 font-medium">Savings Rate</p>
            <p className={`text-xl font-bold mt-1 ${savingsRate >= 20 ? 'text-success-500' : 'text-warn-500'}`}>
              {savingsRate}%
            </p>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 6-month bar chart */}
        <Card padding="sm">
          <h2 className="text-sm font-semibold px-3 pt-2 pb-3">Income vs Expense (6 months)</h2>
          {sixMonthData.length === 0 ? (
            <EmptyState icon="📊" title="No data yet" description="Add transactions to see your trends" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={sixMonthData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 100)}`} />
                <Tooltip formatter={(v: number) => fmt(v, currency)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" fill="var(--chart-2)" name="Income" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" fill="var(--chart-4)" name="Expense" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Expense donut */}
        <Card padding="sm">
          <h2 className="text-sm font-semibold px-3 pt-2 pb-3">Expense by Category</h2>
          {(dash?.topCategories ?? []).length === 0 ? (
            <EmptyState icon="🍩" title="No expenses yet" description="Add transactions to see breakdown" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={dash?.topCategories ?? []}
                  dataKey="total"
                  nameKey="category.name"
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                >
                  {(dash?.topCategories ?? []).map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => fmt(v, currency)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Goals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Active Goals</h2>
            <button onClick={() => void navigate('/goals')} className="text-xs text-brand-600 hover:underline">View all</button>
          </div>
          {(goals ?? []).filter((g) => (g as unknown as { status: string }).status === 'active').length === 0 ? (
            <EmptyState icon="🎯" title="No goals yet" action={{ label: 'Add goal', onClick: () => void navigate('/goals') }} />
          ) : (
            <div className="space-y-3">
              {(goals ?? []).filter((g) => (g as unknown as { status: string }).status === 'active').slice(0, 3).map((goal) => {
                const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal._id} className="flex items-center gap-3">
                    <ProgressRing pct={pct} size={48} color={goal.color} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{goal.icon} {goal.title}</p>
                      <p className="text-xs text-slate-500">{fmt(goal.savedAmount, currency)} / {fmt(goal.targetAmount, currency)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Upcoming recurring */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Upcoming (7 days)</h2>
            <button onClick={() => void navigate('/recurring')} className="text-xs text-brand-600 hover:underline">Manage</button>
          </div>
          {upcoming.length === 0 ? (
            <EmptyState icon="🔄" title="Nothing upcoming" description="No recurring transactions due soon" />
          ) : (
            <div className="space-y-2">
              {upcoming.map((r) => (
                <div key={r._id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{r.templateTransaction.note ?? 'Recurring'}</p>
                    <p className="text-xs text-slate-500">{fmtDate(r.nextDueDate)}</p>
                  </div>
                  <span className={r.templateTransaction.type === 'income' ? 'text-success-500 font-medium' : 'text-danger-500 font-medium'}>
                    {fmt(r.templateTransaction.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI Insight */}
        <div>
          {aiData?.insights && aiData.insights.length > 0 ? (
            <AIInsightCard insights={aiData.insights} />
          ) : (
            <Card className="h-full">
              <div className="flex items-center gap-2 mb-2">
                <span>🤖</span>
                <span className="text-sm font-semibold text-slate-500">AI Insights</span>
              </div>
              <p className="text-xs text-slate-400">Add more transactions to unlock personalized AI insights.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
