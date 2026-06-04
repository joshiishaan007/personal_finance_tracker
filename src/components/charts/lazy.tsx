'use client';

import dynamic from 'next/dynamic';

// recharts is ~heavy and was being hoisted into the shared (app) chunk via
// StatCard's Sparkline, so it loaded on every authed route. Loading the chart
// wrappers on demand (ssr:false — they render only from client-fetched data)
// keeps recharts out of every route's First Load JS. Import charts from HERE,
// not the wrapper files directly.

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full animate-pulse rounded-xl bg-slate-100/80 dark:bg-ink-800/60"
      style={{ height }}
    />
  );
}

export const AreaTrend = dynamic(() => import('./AreaTrend').then((m) => m.AreaTrend), {
  ssr: false,
  loading: () => <ChartSkeleton height={240} />,
});

export const BarsGrouped = dynamic(() => import('./BarsGrouped').then((m) => m.BarsGrouped), {
  ssr: false,
  loading: () => <ChartSkeleton height={240} />,
});

export const Donut = dynamic(() => import('./Donut').then((m) => m.Donut), {
  ssr: false,
  loading: () => <ChartSkeleton height={240} />,
});

export const GaugeRadial = dynamic(() => import('./GaugeRadial').then((m) => m.GaugeRadial), {
  ssr: false,
  loading: () => <ChartSkeleton height={180} />,
});

export const Sparkline = dynamic(() => import('./Sparkline').then((m) => m.Sparkline), {
  ssr: false,
  loading: () => <ChartSkeleton height={36} />,
});

export const PLBarChart = dynamic(() => import('./PLBarChart').then((m) => m.PLBarChart), {
  ssr: false,
  loading: () => <ChartSkeleton height={240} />,
});
