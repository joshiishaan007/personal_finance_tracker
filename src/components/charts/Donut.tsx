"use client";

import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, Sector, ResponsiveContainer } from "recharts";
import { CHART_SERIES } from "./chartTheme";
import { Text } from "@/components/ui/Text";

interface Props {
  data: Array<{ name: string; value: number }>;
  height?: number;
  centerLabel?: string;
  centerValue?: string;
  formatValue?: (v: number) => string;
}

// Render the active sector identically to a normal one — no expansion, no border.
// This suppresses the default recharts white-box / stroke that appears on hover/click.
function renderActiveShape(props: unknown) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props as {
      cx: number;
      cy: number;
      innerRadius: number;
      outerRadius: number;
      startAngle: number;
      endAngle: number;
      fill: string;
    };
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="none"
    />
  );
}

export function Donut({
  data,
  height = 240,
  centerLabel,
  centerValue,
  formatValue,
}: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const onEnter = useCallback(
    (_: unknown, idx: number) => setActiveIdx(idx),
    [],
  );
  const onLeave = useCallback(() => setActiveIdx(null), []);

  const active = activeIdx != null ? data[activeIdx] : null;
  const displayLabel = active ? active.name : centerLabel;
  const displayValue = active
    ? formatValue
      ? formatValue(active.value)
      : String(active.value)
    : centerValue;

  return (
    <div className="relative [&_.recharts-sector:focus]:outline-none [&_.recharts-sector:focus-visible]:outline-none" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="none"
            animationDuration={850}
            activeShape={renderActiveShape}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={CHART_SERIES[i % CHART_SERIES.length]}
                opacity={activeIdx == null || activeIdx === i ? 1 : 0.35}
                stroke="none"
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {(displayLabel || displayValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center px-4">
          {displayLabel && (
            <Text
              as="span"
              className={`block leading-tight transition-all duration-150 ${
                active
                  ? "text-[11px] font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wide"
                  : "text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400"
              }`}
            >
              {displayLabel}
            </Text>
          )}
          {displayValue && (
            <Text
              as="span"
              className="block font-bold tabular-nums text-slate-900 dark:text-slate-50 transition-all duration-150 text-xl leading-tight"
            >
              {displayValue}
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
