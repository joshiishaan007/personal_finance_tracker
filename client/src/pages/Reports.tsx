import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { fmt } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface MonthlyReport {
  grade: string;
  composite: number;
  savingsRate: number;
  savingsScore: number;
  budgetScore: number;
  goalScore: number;
  income: number;
  expense: number;
}

const GRADE_COLOR: Record<string, string> = {
  A: 'text-success-500', B: 'text-brand-500', C: 'text-warn-500', D: 'text-warn-600', F: 'text-danger-500',
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function Reports() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ['reports', 'monthly', year, month],
    queryFn: () =>
      api.get<{ data: MonthlyReport }>(`/api/reports/monthly?year=${year}&month=${month}`)
        .then((r) => r.data.data),
  });

  const { data: yearly } = useQuery({
    queryKey: ['reports', 'yearly', year],
    queryFn: () =>
      api.get<{ data: { monthly: Array<{ _id: { month: number; type: string }; total: number }>; goalsAchieved: number } }>(
        `/api/reports/yearly?year=${year}`
      ).then((r) => r.data.data),
  });

  const yearlyTotalIncome = (yearly?.monthly ?? []).filter((m) => m._id.type === 'income').reduce((s, m) => s + m.total, 0);
  const yearlyTotalExpense = (yearly?.monthly ?? []).filter((m) => m._id.type === 'expense').reduce((s, m) => s + m.total, 0);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Reports</h1>

      {/* Month navigator */}
      <div className="flex items-center gap-3">
        <button onClick={() => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">←</button>
        <span className="font-semibold min-w-32 text-center">{MONTH_NAMES[month - 1]} {year}</span>
        <button onClick={() => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">→</button>
      </div>

      {/* Monthly Report Card */}
      {monthlyLoading ? (
        <div className="skeleton h-48 rounded-xl" />
      ) : monthly && (
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">Monthly Report Card</h2>
              <p className="text-sm text-slate-500">{MONTH_NAMES[month - 1]} {year}</p>
            </div>
            <div className={`text-6xl font-black ${GRADE_COLOR[monthly.grade] ?? 'text-slate-500'}`}>{monthly.grade}</div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-500">{Math.round(monthly.savingsScore)}%</p>
              <p className="text-xs text-slate-500 mt-1">Savings Score</p>
              <p className="text-xs text-slate-400">(rate: {Math.round(monthly.savingsRate)}%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-500">{Math.round(monthly.budgetScore)}%</p>
              <p className="text-xs text-slate-500 mt-1">Budget Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-brand-500">{Math.round(monthly.goalScore)}%</p>
              <p className="text-xs text-slate-500 mt-1">Goal Score</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500">
            <strong>Grading rubric:</strong> Savings rate (40%) + Budget adherence (40%) + Goal progress (20%). A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F &lt; 60.
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-xs text-slate-500">Income</p>
              <p className="font-semibold text-success-500">{fmt(monthly.income, currency)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Expense</p>
              <p className="font-semibold text-danger-500">{fmt(monthly.expense, currency)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Year-in-review */}
      {yearly && (
        <Card>
          <h2 className="text-lg font-bold mb-4">Year in Review — {year}</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-success-500">{fmt(yearlyTotalIncome, currency)}</p>
              <p className="text-xs text-slate-500">Total Income</p>
            </div>
            <div>
              <p className="text-xl font-bold text-danger-500">{fmt(yearlyTotalExpense, currency)}</p>
              <p className="text-xs text-slate-500">Total Expense</p>
            </div>
            <div>
              <p className="text-xl font-bold text-brand-500">{fmt(yearlyTotalIncome - yearlyTotalExpense, currency)}</p>
              <p className="text-xs text-slate-500">Net Saved</p>
            </div>
          </div>
          {yearly.goalsAchieved > 0 && (
            <div className="mt-4 p-3 bg-success-50 dark:bg-success-950/20 rounded-lg text-center">
              <p className="text-sm font-medium text-success-700 dark:text-success-400">🎉 You achieved {yearly.goalsAchieved} goal{yearly.goalsAchieved > 1 ? 's' : ''} this year!</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
