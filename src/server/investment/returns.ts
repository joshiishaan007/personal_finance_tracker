// Pure investment projection math. All amounts are integer minor units. Compound
// interest is scale-invariant, so we multiply the minor-unit integer by a float
// growth factor and round once at the end — no currency-decimal juggling.

import type { InvestmentKind, Compounding } from '@/shared';

const PERIODS: Record<Compounding, number> = { monthly: 12, quarterly: 4, halfyearly: 2, yearly: 1 };

// FD / lump-sum compound maturity: P * (1 + r/(100n))^(n*t).
function fdMaturity(principalMinor: number, ratePct: number, tenureMonths: number, compounding: Compounding): number {
  const n = PERIODS[compounding];
  const t = tenureMonths / 12;
  const factor = Math.pow(1 + ratePct / (100 * n), n * t);
  return Math.round(principalMinor * factor);
}

// Future value of a monthly annuity-due (deposit at start of each month): used for
// RD and SIP. monthly * [((1+i)^N - 1)/i] * (1+i), i = monthly rate.
function annuityDueFV(monthlyMinor: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const i = annualRatePct / 1200;
  if (i === 0) return monthlyMinor * months;
  const factor = ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  return Math.round(monthlyMinor * factor);
}

// PPF: yearly compounding on an annual contribution (monthly * 12), annuity-due.
function ppfMaturity(monthlyMinor: number, ratePct: number, tenureMonths: number): number {
  const years = tenureMonths / 12;
  if (years <= 0) return 0;
  const yearlyMinor = monthlyMinor * 12;
  const r = ratePct / 100;
  if (r === 0) return Math.round(yearlyMinor * years);
  const factor = ((Math.pow(1 + r, years) - 1) / r) * (1 + r);
  return Math.round(yearlyMinor * factor);
}

// Equity / MF: prefer a manual current value; else grow invested by expected annual %.
function equityProjection(investedMinor: number, currentValueMinor?: number, expectedAnnualPct?: number, tenureMonths?: number): number {
  if (typeof currentValueMinor === 'number' && currentValueMinor > 0) return currentValueMinor;
  if (expectedAnnualPct && tenureMonths) {
    const years = tenureMonths / 12;
    return Math.round(investedMinor * Math.pow(1 + expectedAnnualPct / 100, years));
  }
  return investedMinor;
}

export interface ProjectionInput {
  kind: InvestmentKind;
  investedAmount: number; // actual contributions logged (minor units)
  principal?: number;
  monthlyAmount?: number;
  ratePct?: number;
  tenureMonths?: number;
  compounding?: Compounding;
  currentValue?: number;
  startDate: Date;
}

export interface Projection {
  totalContribution: number; // planned basis for the return calc (minor units)
  projectedValue: number; // maturity / projected value (minor units)
  expectedReturn: number; // projectedValue - totalContribution
  maturityDate?: Date;
}

export function projectInvestment(inv: ProjectionInput): Projection {
  const rate = inv.ratePct ?? 0;
  const tenure = inv.tenureMonths ?? 0;
  const monthly = inv.monthlyAmount ?? 0;
  // Lump base: prefer actual contributions, fall back to the seed principal.
  const lumpBase = inv.investedAmount > 0 ? inv.investedAmount : inv.principal ?? 0;

  let totalContribution: number;
  let projectedValue: number;

  switch (inv.kind) {
    case 'fd':
      totalContribution = lumpBase;
      projectedValue = rate && tenure ? fdMaturity(lumpBase, rate, tenure, inv.compounding ?? 'quarterly') : lumpBase;
      break;
    case 'rd':
    case 'sip':
      totalContribution = monthly * tenure;
      projectedValue = annuityDueFV(monthly, rate, tenure);
      break;
    case 'ppf':
      totalContribution = monthly * tenure;
      projectedValue = ppfMaturity(monthly, rate, tenure);
      break;
    case 'equity':
    default:
      totalContribution = lumpBase;
      projectedValue = equityProjection(lumpBase, inv.currentValue, rate, tenure);
      break;
  }

  const maturityDate = tenure
    ? (() => {
        const d = new Date(inv.startDate);
        d.setMonth(d.getMonth() + tenure);
        return d;
      })()
    : undefined;

  return {
    totalContribution,
    projectedValue,
    expectedReturn: projectedValue - totalContribution,
    maturityDate,
  };
}
