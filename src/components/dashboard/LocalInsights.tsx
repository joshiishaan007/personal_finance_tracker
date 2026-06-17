'use client';

import { Lightbulb, AlertTriangle, TrendingUp, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useAnalytics';
import { useSpendingPlan } from '@/hooks/useSpendingPlan';
import { useRecurring } from '@/hooks/useRecurring';
import { deriveInsights, type InsightTone } from '@/lib/insights';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { SectionHeader } from '@/components/SectionHeader';

const TONE: Record<InsightTone, { icon: typeof Info; cls: string }> = {
  danger: { icon: AlertTriangle, cls: 'text-danger-500' },
  warning: { icon: AlertTriangle, cls: 'text-warn-500' },
  info: { icon: Info, cls: 'text-aqua-500' },
  positive: { icon: TrendingUp, cls: 'text-success-500' },
};

export function LocalInsights() {
  const { user } = useAuth();
  const { data: dash } = useDashboard();
  const { data: plan } = useSpendingPlan();
  const { data: recurring } = useRecurring();

  const currency = dash?.currency ?? user?.currency ?? 'INR';

  // Previous month's net from the 6-month series (second-to-last month present).
  const monthMap = new Map<string, { income: number; expense: number }>();
  for (const d of dash?.sixMonth ?? []) {
    const key = `${d._id.year}-${String(d._id.month).padStart(2, '0')}`;
    const e = monthMap.get(key) ?? { income: 0, expense: 0 };
    if (d._id.type === 'income') e.income = d.total;
    else if (d._id.type === 'expense') e.expense = d.total;
    monthMap.set(key, e);
  }
  const sorted = [...monthMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2]![1] : null;
  const prevNet = prev ? prev.income - prev.expense : null;

  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86_400_000);
  const due = (recurring ?? []).filter((r) => {
    const d = new Date(r.nextDueDate);
    return d >= now && d <= in7;
  });

  const insights = deriveInsights({
    currency,
    summary: dash?.summary ?? { income: 0, expense: 0, net: 0, savingsRate: 0 },
    topCategories: (dash?.topCategories ?? []).map((c) => ({ name: c.category.name, total: c.total })),
    buckets: (plan?.buckets ?? []).map((b) => ({ name: b.name, kind: b.kind, used: b.used, allocated: b.allocated, remaining: b.remaining })),
    planHasIncome: !!plan && plan.cycle.source !== 'none' && plan.cycle.baseIncome > 0,
    upcoming: { count: due.length, total: due.reduce((s, r) => s + r.templateTransaction.amount, 0) },
    prevNet,
  });

  if (insights.length === 0) return null;

  return (
    <Card>
      <SectionHeader title="Insights" subtitle="Computed privately on your device" icon={Lightbulb} />
      <div className="mt-4 space-y-2.5">
        {insights.map((ins) => {
          const meta = TONE[ins.tone];
          const Icon = meta.icon;
          return (
            <div key={ins.id} className="flex items-start gap-3 rounded-xl bg-slate-50 dark:bg-ink-800/60 p-3">
              <Icon size={16} strokeWidth={2.3} className={`mt-0.5 shrink-0 ${meta.cls}`} />
              <div className="min-w-0">
                <Text className="text-sm font-semibold text-slate-900 dark:text-slate-50">{ins.title}</Text>
                <Text variant="small" className="text-slate-500">{ins.detail}</Text>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
