// Client-side P&L PDF report. jsPDF + autotable are dynamically imported so they
// never touch the main bundle — only loaded when the user actually exports.
// Amounts use the currency CODE (e.g. "INR 1,234.00") because jsPDF's built-in
// fonts don't include symbols like ₹.

export interface PlReportTxn {
  date: string; // ISO
  type: string;
  category: string;
  note: string;
  amount: number; // minor units, signed by type handled by caller
}

export interface PlReportInput {
  currency: string;
  mode: 'month' | 'year';
  periodLabel: string; // "June 2026" or "2026"
  income: number;
  expense: number;
  net: number;
  categories?: { name: string; amount: number }[]; // month mode (top expense)
  months?: { name: string; income: number; expense: number; net: number }[]; // year mode
  transactions?: PlReportTxn[]; // omitted when "without transactions"
}

type RGB = [number, number, number];
const GREEN: RGB = [18, 184, 140];
const RED: RGB = [225, 29, 72];
const SLATE: RGB = [100, 116, 139];

export async function downloadPlReportPdf(input: PlReportInput): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const locale = input.currency === 'INR' ? 'en-IN' : 'en-US';
  const nf = new Intl.NumberFormat(locale, {
    style: 'currency', currency: input.currency, currencyDisplay: 'code',
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  });
  const money = (minor: number) => nf.format(minor / 100);

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 40; // margin
  let y = M;

  // ── Header ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text('Profit & Loss', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...SLATE);
  doc.text(input.periodLabel, M, y + 18);
  const generated = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date());
  doc.text(`Generated ${generated}`, W - M, y + 18, { align: 'right' });
  y += 40;

  // ── Summary table ──
  const profit = input.net >= 0;
  autoTable(doc, {
    startY: y,
    head: [['Summary', 'Amount']],
    body: [
      ['Income', money(input.income)],
      ['Expense', money(input.expense)],
      [profit ? 'Net profit' : 'Net loss', `${profit ? '+' : '-'}${money(Math.abs(input.net))}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], halign: 'left' },
    columnStyles: { 1: { halign: 'right' } },
    didParseCell: (d) => {
      if (d.section === 'body' && d.row.index === 2) {
        d.cell.styles.fontStyle = 'bold';
        d.cell.styles.textColor = profit ? GREEN : RED;
      }
    },
    margin: { left: M, right: M },
  });
  // @ts-expect-error autotable augments doc.lastAutoTable at runtime
  y = (doc.lastAutoTable.finalY as number) + 24;

  // ── Chart ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(input.mode === 'year' ? 'Net by month' : 'Income vs Expense', M, y);
  y += 10;
  const chartH = 130;
  const chartW = W - M * 2;

  if (input.mode === 'year' && input.months) {
    drawNetBars(doc, M, y, chartW, chartH, input.months.map((m) => ({ label: m.name, net: m.net })));
  } else {
    drawPosBars(doc, M, y, chartW, chartH, [
      { label: 'Income', value: input.income, color: GREEN },
      { label: 'Expense', value: input.expense, color: RED },
    ], money);
  }
  y += chartH + 30;

  // ── Detail table (month: categories; year: monthly) ──
  if (input.mode === 'month' && input.categories?.length) {
    autoTable(doc, {
      startY: y,
      head: [['Top spending', 'Amount', '% of expense']],
      body: input.categories.map((c) => [
        c.name,
        money(c.amount),
        input.expense > 0 ? `${Math.round((c.amount / input.expense) * 100)}%` : '0%',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      margin: { left: M, right: M },
    });
    // @ts-expect-error runtime
    y = (doc.lastAutoTable.finalY as number) + 24;
  } else if (input.mode === 'year' && input.months) {
    autoTable(doc, {
      startY: y,
      head: [['Month', 'Income', 'Expense', 'Net']],
      body: input.months.map((m) => [m.name, money(m.income), money(m.expense), `${m.net >= 0 ? '+' : '-'}${money(Math.abs(m.net))}`]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: M, right: M },
    });
    // @ts-expect-error runtime
    y = (doc.lastAutoTable.finalY as number) + 24;
  }

  // ── Transactions (optional) ──
  if (input.transactions?.length) {
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Category', 'Note', 'Amount']],
      body: input.transactions.map((t) => [
        new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date(t.date)),
        t.type,
        t.category,
        t.note,
        money(t.amount),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 4: { halign: 'right' } },
      margin: { left: M, right: M },
    });
  }

  doc.save(`pl-report-${input.periodLabel.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

// Two positive bars (income/expense) with value labels and a baseline.
function drawPosBars(
  doc: import('jspdf').jsPDF, x: number, y: number, w: number, h: number,
  bars: { label: string; value: number; color: RGB }[], money: (n: number) => string,
) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const gap = 40;
  const bw = (w - gap * (bars.length + 1)) / bars.length;
  doc.setDrawColor(203, 213, 225);
  doc.line(x, y + h, x + w, y + h);
  bars.forEach((b, i) => {
    const bx = x + gap + i * (bw + gap);
    const bh = (b.value / max) * (h - 18);
    doc.setFillColor(...b.color);
    doc.rect(bx, y + h - bh, bw, bh, 'F');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(money(b.value), bx + bw / 2, y + h - bh - 4, { align: 'center' });
    doc.setTextColor(...SLATE);
    doc.text(b.label, bx + bw / 2, y + h + 12, { align: 'center' });
  });
}

// 12 signed net bars around a zero baseline (green up, red down) + month labels.
function drawNetBars(
  doc: import('jspdf').jsPDF, x: number, y: number, w: number, h: number,
  items: { label: string; net: number }[],
) {
  const maxAbs = Math.max(...items.map((i) => Math.abs(i.net)), 1);
  const mid = y + h / 2;
  doc.setDrawColor(203, 213, 225);
  doc.line(x, mid, x + w, mid);
  const gap = 6;
  const bw = (w - gap * (items.length + 1)) / items.length;
  items.forEach((it, i) => {
    const bx = x + gap + i * (bw + gap);
    const bh = (Math.abs(it.net) / maxAbs) * (h / 2 - 12);
    const positive = it.net >= 0;
    doc.setFillColor(...(positive ? GREEN : RED));
    doc.rect(bx, positive ? mid - bh : mid, bw, bh, 'F');
    doc.setFontSize(6);
    doc.setTextColor(...SLATE);
    doc.text(it.label, bx + bw / 2, y + h + 10, { align: 'center' });
  });
}
