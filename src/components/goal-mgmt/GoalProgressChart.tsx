'use client';

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Text } from '@/components/ui/Text';
import type { Contribution } from '@/hooks/useContributions';
import type { LifeGoal } from '@/hooks/useLifeGoals';

interface Props {
  contributions: Contribution[];
  goal: LifeGoal;
}

export function GoalProgressChart({ contributions, goal }: Props) {
  const data = useMemo(() => {
    if (contributions.length < 2) return [];

    const sorted = [...contributions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let cumulative = 0;
    const points: { label: string; progress: number }[] = [];

    for (const c of sorted) {
      cumulative += c.value;
      const d = new Date(c.date);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      const progress = goal.targetValue
        ? Math.min(cumulative, goal.targetValue)
        : cumulative;

      const last = points[points.length - 1];
      if (last?.label === label) {
        last.progress = progress;
      } else {
        points.push({ label, progress });
      }
    }
    return points;
  }, [contributions, goal]);

  if (data.length < 2) return null;

  const color = goal.color ?? '#14B8A6';
  const gradId = `pgrd-${goal._id.slice(-6)}`;

  return (
    <div>
      <Text as="span" className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Progress over time
      </Text>
      <div className="mt-2">
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.92)',
                border: 'none',
                borderRadius: 8,
                fontSize: 12,
                padding: '6px 10px',
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: 2 }}
              itemStyle={{ color }}
              formatter={(v: number) => [`${v}${goal.unit ? ` ${goal.unit}` : ''}`, 'Cumulative']}
            />
            {goal.targetValue ? (
              <ReferenceLine
                y={goal.targetValue}
                stroke={color}
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                label={{
                  value: `Goal: ${goal.targetValue}${goal.unit ? ` ${goal.unit}` : ''}`,
                  fill: color,
                  fontSize: 9,
                  position: 'insideTopRight',
                }}
              />
            ) : null}
            <Area
              type="monotone"
              dataKey="progress"
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
