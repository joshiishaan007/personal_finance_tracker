// Shared calendar-grid math for the GitHub-style heatmaps (goals activity +
// spending). Pure: turns a list of {date,value} into Mon-started week columns
// spanning the last ~53 weeks, plus the month labels above them.

export const HEATMAP_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface HeatmapCell {
  date: string; // 'YYYY-MM-DD'
  value: number;
  future: boolean;
}

export function buildHeatmapWeeks(days: { date: string; value: number }[]): {
  weeks: HeatmapCell[][];
  monthLabels: Array<{ col: number; label: string }>;
} {
  const map = new Map(days.map((d) => [d.date, d.value]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - 52 * 7);
  const startDow = (start.getDay() + 6) % 7; // Mon=0
  start.setDate(start.getDate() - startDow);

  const weeks: HeatmapCell[][] = [];
  const monthLabels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  const cursor = new Date(start);

  for (let w = 0; w < 53; w++) {
    const week: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const ds = cursor.toISOString().split('T')[0]!;
      const future = cursor > today;
      if (d === 0 && !future && cursor.getMonth() !== lastMonth) {
        monthLabels.push({ col: w, label: HEATMAP_MONTHS[cursor.getMonth()]! });
        lastMonth = cursor.getMonth();
      }
      week.push({ date: ds, value: map.get(ds) ?? 0, future });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return { weeks, monthLabels };
}
