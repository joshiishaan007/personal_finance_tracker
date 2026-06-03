// Single source of chart styling — all colors are CSS vars (themed in globals.css),
// never raw hex. Charts spread these onto recharts axes/grids.
export const CHART_SERIES = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)',
  'var(--chart-5)', 'var(--chart-6)', 'var(--chart-7)', 'var(--chart-8)',
];

export const axisProps = {
  tick: { fontSize: 11, fill: 'var(--chart-axis)' },
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  strokeDasharray: '4 4',
  stroke: 'var(--chart-grid)',
  vertical: false,
} as const;

export interface ChartSeries {
  key: string;
  label: string;
  colorVar: string; // e.g. 'var(--chart-1)'
}
