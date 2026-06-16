'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';
import { useAuth } from '@/contexts/AuthContext';
import type { MonthlyAnalytics, YearlyAnalytics } from '@/hooks/useAnalytics';
import { downloadPlReportPdf, type PlReportTxn } from '@/lib/pdfReport';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Category { _id: string; name: string }
interface Txn { _id: string; date: string; type: string; categoryId: string; note?: string; amount: number }

export function ExportReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;

  const [mode, setMode] = useState<'month' | 'year'>('month');
  const [year, setYear] = useState(curYear);
  const [month, setMonth] = useState(curMonth);
  const [includeTx, setIncludeTx] = useState(false);
  const [busy, setBusy] = useState(false);

  const years = Array.from({ length: 11 }, (_, i) => curYear - i);
  // Past/current only: hide future months when viewing the current year.
  const months = MONTH_NAMES
    .map((name, i) => ({ value: String(i + 1), label: name }))
    .filter((m) => !(year === curYear && Number(m.value) > curMonth));

  async function fetchTransactions(startIso: string, endIso: string): Promise<PlReportTxn[]> {
    const cats = await api.get<{ data: Category[] }>(ENDPOINTS.categories.list).then((r) => r.data.data);
    const catName = new Map(cats.map((c) => [c._id, c.name]));
    const out: PlReportTxn[] = [];
    for (let page = 1; page <= 20; page++) {
      const qs = new URLSearchParams({ startDate: startIso, endDate: endIso, limit: '100', page: String(page) }).toString();
      const res = await api.get<{ data: { items: Txn[]; hasMore: boolean } }>(ENDPOINTS.transactions.list(qs)).then((r) => r.data.data);
      out.push(...res.items.map((t) => ({
        date: t.date, type: t.type, category: catName.get(t.categoryId) ?? '—', note: t.note ?? '', amount: t.amount,
      })));
      if (!res.hasMore) break;
    }
    return out;
  }

  async function download() {
    setBusy(true);
    try {
      const isYear = mode === 'year';
      const start = (isYear ? new Date(year, 0, 1) : new Date(year, month - 1, 1)).toISOString();
      const end = (isYear ? new Date(year, 11, 31, 23, 59, 59, 999) : new Date(year, month, 0, 23, 59, 59, 999)).toISOString();
      const transactions = includeTx ? await fetchTransactions(start, end) : undefined;

      if (isYear) {
        const data = await api.get<{ data: YearlyAnalytics }>(ENDPOINTS.analytics.yearly(`year=${year}`)).then((r) => r.data.data);
        const inc = new Map<number, number>();
        const exp = new Map<number, number>();
        for (const m of data.monthly) {
          const map = m._id.type === 'income' ? inc : exp;
          map.set(m._id.month, (map.get(m._id.month) ?? 0) + m.total);
        }
        const months12 = MONTH_NAMES.map((n, i) => {
          const income = inc.get(i + 1) ?? 0;
          const expense = exp.get(i + 1) ?? 0;
          return { name: n.slice(0, 3), income, expense, net: income - expense };
        });
        const income = months12.reduce((s, m) => s + m.income, 0);
        const expense = months12.reduce((s, m) => s + m.expense, 0);
        await downloadPlReportPdf({ currency, mode: 'year', periodLabel: String(year), income, expense, net: income - expense, months: months12, transactions });
      } else {
        const data = await api.get<{ data: MonthlyAnalytics }>(ENDPOINTS.analytics.monthly(`year=${year}&month=${month}`)).then((r) => r.data.data);
        const categories = (data.byCategory ?? []).slice(0, 8).map((c) => ({ name: c.category?.name ?? 'Uncategorised', amount: c.total }));
        await downloadPlReportPdf({
          currency, mode: 'month', periodLabel: `${MONTH_NAMES[month - 1]} ${year}`,
          income: data.summary.income, expense: data.summary.expense, net: data.summary.net, categories, transactions,
        });
      }
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Download P&L report"
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="button" variant="gradient" loading={busy} onClick={download} className="flex-1" leftIcon={<FileText size={15} strokeWidth={2.2} />}>
            Download PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select label="Period" value={mode} onChange={(e) => setMode(e.target.value as 'month' | 'year')} options={[{ value: 'month', label: 'A month' }, { value: 'year', label: 'A full year' }]} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Year" value={String(year)} onChange={(e) => setYear(Number(e.target.value))} options={years.map((y) => ({ value: String(y), label: String(y) }))} />
          {mode === 'month' && (
            <Select label="Month" value={String(Math.min(month, year === curYear ? curMonth : 12))} onChange={(e) => setMonth(Number(e.target.value))} options={months} />
          )}
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-ink-800/40 px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <Text className="text-sm font-medium leading-tight">Include transactions</Text>
            <Text variant="small" className="text-slate-500 leading-tight">Append the full transaction list for the period.</Text>
          </div>
          <Switch checked={includeTx} onChange={setIncludeTx} label="Include transactions" className="mt-0.5" />
        </div>

        <Text variant="small" className="text-slate-400">
          The report covers profit &amp; loss only — income, expense and net — with charts. Budgets, spending plan and investments are not included.
        </Text>
      </div>
    </Modal>
  );
}
