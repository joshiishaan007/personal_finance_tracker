import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

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
  const [dismissed, setDismissed] = useState(false);
  const [whyOpen, setWhyOpen] = useState<number | null>(null);
  const qc = useQueryClient();

  const dismiss = useMutation({
    mutationFn: () => api.post('/api/ai/insights/dismiss'),
    onSuccess: () => {
      setDismissed(true);
      void qc.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });

  if (dismissed || insights.length === 0) return null;

  const typeIcon: Record<string, string> = {
    spending_anomaly: '⚠️',
    savings_opportunity: '💡',
    cashflow_warning: '🚨',
    goal_projection: '🎯',
    encouragement: '🌟',
  };

  return (
    <div className="bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-950/30 dark:to-indigo-950/30 border border-brand-200 dark:border-brand-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🤖</span>
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">AI Insights</span>
        </div>
        <button
          onClick={() => dismiss.mutate()}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label="Dismiss AI insights"
        >
          ✕
        </button>
      </div>
      <div className="space-y-3">
        {insights.map((ins, i) => (
          <div key={i} className="bg-white/70 dark:bg-slate-900/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5">{typeIcon[ins.type] ?? '💡'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ins.title}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{ins.body}</p>
                <button
                  onClick={() => setWhyOpen(whyOpen === i ? null : i)}
                  className="text-xs text-brand-600 dark:text-brand-400 mt-1 hover:underline"
                  aria-expanded={whyOpen === i}
                >
                  {whyOpen === i ? 'Hide' : 'Why this? →'}
                </button>
                {whyOpen === i && (
                  <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 font-mono">
                    {ins.why}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
