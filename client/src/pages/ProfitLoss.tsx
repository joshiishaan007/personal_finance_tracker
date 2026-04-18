import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { fmt, cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';

interface PLActual {
  _id: { type: string; categoryId: string };
  actual: number;
  category?: { name: string; icon: string };
}

interface Budget {
  _id: string;
  categoryId: { _id: string; name: string; icon: string } | string;
  amount: number;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function ProfitLoss() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, isLoading } = useQuery({
    queryKey: ['pl', year, month],
    queryFn: () =>
      api.get<{ data: { actual: PLActual[]; budgets: Budget[] } }>(
        `/api/pl?year=${year}&month=${month}`
      ).then((r) => r.data.data),
  });

  const incomeRows = (data?.actual ?? []).filter((a) => a._id.type === 'income');
  const expenseRows = (data?.actual ?? []).filter((a) => a._id.type === 'expense');
  const totalIncome = incomeRows.reduce((s, r) => s + r.actual, 0);
  const totalExpense = expenseRows.reduce((s, r) => s + r.actual, 0);
  const netSavings = totalIncome - totalExpense;

  const budgetMap = Object.fromEntries(
    (data?.budgets ?? []).map((b) => {
      const catId = typeof b.categoryId === 'object' ? b.categoryId._id : b.categoryId;
      return [catId, b.amount];
    })
  );

  function variance(actual: number, expected: number, isExpense: boolean) {
    const diff = isExpense ? expected - actual : actual - expected;
    return diff;
  }

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Profit & Loss</h1>
        <div className="flex items-center gap-2 ml-auto">
          <button onClick={() => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">←</button>
          <span className="font-medium text-sm min-w-32 text-center">{MONTH_NAMES[month - 1]} {year}</span>
          <button onClick={() => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">→</button>
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton h-64 rounded-xl" />
      ) : (
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Profit and loss table">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Expected</th>
                <th className="px-4 py-3 text-right font-semibold">Actual</th>
                <th className="px-4 py-3 text-right font-semibold">Variance</th>
              </tr>
            </thead>
            <tbody>
              {/* Income section */}
              <tr className="bg-success-50/50 dark:bg-success-950/20">
                <td colSpan={4} className="px-4 py-2 font-semibold text-success-700 dark:text-success-400 text-xs uppercase tracking-wide">Income</td>
              </tr>
              {incomeRows.map((row, i) => {
                const expected = budgetMap[row._id.categoryId] ?? 0;
                const v = variance(row.actual, expected, false);
                return (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-900">
                    <td className="px-4 py-2.5">{row.category?.icon} {row.category?.name ?? 'Other'}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{expected ? fmt(expected, currency) : '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{fmt(row.actual, currency)}</td>
                    <td className={cn('px-4 py-2.5 text-right font-medium', v >= 0 ? 'text-success-600' : 'text-danger-600')}>
                      {v >= 0 ? '+' : ''}{expected ? fmt(v, currency) : '—'}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-success-50/30 dark:bg-success-950/10 font-semibold">
                <td className="px-4 py-2.5">Total Income</td>
                <td className="px-4 py-2.5 text-right text-slate-500">—</td>
                <td className="px-4 py-2.5 text-right text-success-600">{fmt(totalIncome, currency)}</td>
                <td className="px-4 py-2.5 text-right">—</td>
              </tr>

              {/* Expense section */}
              <tr className="bg-danger-50/50 dark:bg-danger-950/20">
                <td colSpan={4} className="px-4 py-2 font-semibold text-danger-700 dark:text-danger-400 text-xs uppercase tracking-wide">Expenses</td>
              </tr>
              {expenseRows.map((row, i) => {
                const expected = budgetMap[row._id.categoryId] ?? 0;
                const v = variance(row.actual, expected, true);
                return (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-900">
                    <td className="px-4 py-2.5">{row.category?.icon} {row.category?.name ?? 'Other'}</td>
                    <td className="px-4 py-2.5 text-right text-slate-500">{expected ? fmt(expected, currency) : '—'}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{fmt(row.actual, currency)}</td>
                    <td className={cn('px-4 py-2.5 text-right font-medium', v >= 0 ? 'text-success-600' : 'text-danger-600')}>
                      {v >= 0 ? '+' : ''}{expected ? fmt(v, currency) : '—'}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-danger-50/30 dark:bg-danger-950/10 font-semibold">
                <td className="px-4 py-2.5">Total Expense</td>
                <td className="px-4 py-2.5 text-right text-slate-500">—</td>
                <td className="px-4 py-2.5 text-right text-danger-600">{fmt(totalExpense, currency)}</td>
                <td className="px-4 py-2.5 text-right">—</td>
              </tr>

              {/* Net */}
              <tr className="font-bold text-base">
                <td className="px-4 py-3">Net Savings</td>
                <td className="px-4 py-3 text-right">—</td>
                <td className={cn('px-4 py-3 text-right', netSavings >= 0 ? 'text-success-600' : 'text-danger-600')}>
                  {fmt(Math.abs(netSavings), currency)} {netSavings >= 0 ? '▲' : '▼'}
                </td>
                <td className="px-4 py-3 text-right">—</td>
              </tr>
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
