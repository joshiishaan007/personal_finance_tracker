import { budgetRepository as budgetRepo } from '../budget/budget.repository';
import { transactionRepository as txRepo } from '../transaction/transaction.repository';
import { categoryRepository as catRepo } from '../category/category.repository';
import { pushService } from './push.service';

export const budgetAlertService = {
  /**
   * Called fire-and-forget after every expense transaction.
   * Checks if any monthly budget for the affected category has crossed 85 % or
   * 90 %, and sends one push notification per threshold.  After 90 % is hit the
   * first time every subsequent expense in that category also gets a nudge.
   */
  async checkAfterTransaction(userId: string, categoryId: string, txDate: Date): Promise<void> {
    const budget = await budgetRepo.findByCategory(userId, categoryId);
    if (!budget || budget.period !== 'monthly') return;

    const year  = txDate.getFullYear();
    const mon   = txDate.getMonth();
    const month = `${year}-${String(mon + 1).padStart(2, '0')}`;
    const from  = new Date(year, mon, 1);
    const to    = new Date(year, mon + 1, 0, 23, 59, 59, 999);

    const spent = await txRepo.sumByCategoryPeriod(userId, categoryId, from, to);
    const pct   = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    if (pct < 85) return;

    // Resolve alert state, resetting if the stored month is different.
    const savedMonth = budget.alerts?.month ?? '';
    const pct85Sent  = savedMonth === month ? (budget.alerts?.pct85 ?? false) : false;
    const pct90Sent  = savedMonth === month ? (budget.alerts?.pct90 ?? false) : false;

    let title: string;
    let body:  string;
    const alertSet: Record<string, unknown> = { 'alerts.month': month };

    if (pct >= 90 && pct90Sent) {
      // 90%+ threshold already announced — nudge on every further expense.
      title = '🚨 Still over budget';
      body  = `${Math.round(pct)}% used — keep an eye on spending`;
    } else if (pct >= 90) {
      title = '🚨 Budget at 90%+';
      body  = `${Math.round(pct)}% of your monthly budget is used`;
      alertSet['alerts.pct85'] = true;
      alertSet['alerts.pct90'] = true;
    } else if (!pct85Sent) {
      // First crossing of 85%.
      title = '⚠️ Budget at 85%';
      body  = `${Math.round(pct)}% of your monthly budget is used`;
      alertSet['alerts.pct85'] = true;
    } else {
      return; // 85–90% range, 85% already notified, nothing to do yet
    }

    await budgetRepo.updateAlerts(String(budget._id), alertSet);

    const cat = await catRepo.findById(categoryId);
    const catName = (cat as { name?: string } | null)?.name ?? 'Budget';

    await pushService.sendToUser(userId, {
      title: `${catName}: ${title}`,
      body,
      tag: `budget-${String(budget._id)}-${month}`,
      url: '/budgets',
    });
  },
};
