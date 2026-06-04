'use client';

import { useState } from 'react';
import { Sparkles, AlertTriangle, PiggyBank, TrendingDown, Target, type LucideIcon } from 'lucide-react';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';

interface Insight {
  type: string;
  title: string;
  body: string;
  why: string;
  dataPoints: Record<string, number>;
}

interface Props {
  insights: Insight[];
}

export function AIInsightCard({ insights }: Props) {
  const [whyOpen, setWhyOpen] = useState<number | null>(null);

  if (insights.length === 0) return null;

  const typeIcon: Record<string, LucideIcon> = {
    spending_anomaly: AlertTriangle,
    savings_opportunity: PiggyBank,
    cashflow_warning: TrendingDown,
    goal_projection: Target,
    encouragement: Sparkles,
  };

  return (
    <div className="bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-900/20 border border-brand-200 dark:border-brand-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-brand-600 dark:text-brand-400" />
        <Text as="span" className="text-sm font-semibold text-brand-700 dark:text-brand-400">AI Insights</Text>
      </div>
      <div className="space-y-3">
        {insights.map((ins, i) => {
          const Icon = typeIcon[ins.type] ?? Sparkles;
          return (
          <div key={i} className="bg-white/70 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Icon size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
              <div className="flex-1 min-w-0">
                <Text className="font-medium">{ins.title}</Text>
                <Text variant="muted" className="text-xs mt-0.5">{ins.body}</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setWhyOpen(whyOpen === i ? null : i)}
                  className="text-xs text-brand-600 dark:text-brand-400 mt-1 hover:underline px-0 min-h-0"
                  aria-expanded={whyOpen === i}
                >
                  {whyOpen === i ? 'Hide' : 'Why this? →'}
                </Button>
                {whyOpen === i && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {ins.why}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
