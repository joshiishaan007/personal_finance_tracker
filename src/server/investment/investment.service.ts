import { investmentRepository as repo } from './investment.repository';
import { projectInvestment } from './returns';
import { Ok, Err, type Result } from '../http/result';
import type { CreateInvestment, UpdateInvestment, InvestmentView } from '@/shared';

export const investmentService = {
  async list(userId: string): Promise<InvestmentView[]> {
    const [investments, invested] = await Promise.all([
      repo.list(userId),
      repo.investedByInvestment(userId),
    ]);
    const investedMap = new Map(invested.map((r) => [String(r._id), r.total]));

    return investments.map((inv) => {
      const investedAmount = investedMap.get(String(inv._id)) ?? 0;
      const startDate = new Date(inv.startDate);
      const projection = projectInvestment({
        kind: inv.kind,
        investedAmount,
        principal: inv.principal,
        monthlyAmount: inv.monthlyAmount,
        ratePct: inv.ratePct,
        tenureMonths: inv.tenureMonths,
        compounding: inv.compounding,
        currentValue: inv.currentValue,
        startDate,
      });

      return {
        _id: String(inv._id),
        name: inv.name,
        kind: inv.kind,
        icon: inv.icon,
        color: inv.color,
        status: inv.status,
        startDate: startDate.toISOString(),
        ratePct: inv.ratePct,
        tenureMonths: inv.tenureMonths,
        compounding: inv.compounding,
        principal: inv.principal,
        monthlyAmount: inv.monthlyAmount,
        currentValue: inv.currentValue,
        note: inv.note,
        investedAmount,
        totalContribution: projection.totalContribution,
        projectedValue: projection.projectedValue,
        expectedReturn: projection.expectedReturn,
        maturityDate: projection.maturityDate?.toISOString(),
      };
    });
  },

  create: (userId: string, data: CreateInvestment) =>
    repo.create(userId, { ...data, startDate: new Date(data.startDate) }),

  async update(userId: string, id: string, data: UpdateInvestment): Promise<Result<unknown, 'not_found'>> {
    const set: Record<string, unknown> = { ...data };
    if (data.startDate) set.startDate = new Date(data.startDate);
    const inv = await repo.update(userId, id, set);
    return inv ? Ok(inv) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ success: true }, 'not_found'>> {
    await repo.remove(userId, id);
    return Ok({ success: true });
  },
};
