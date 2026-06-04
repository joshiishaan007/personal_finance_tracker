import { GoalsView } from '@/components/goal/GoalsView';

// Financial savings goals (target ₹ / saved ₹) live in Finance mode at /savings.
// Life-goals + tasks are the separate Goals mode at /goals.
export default function SavingsGoalsPage() {
  return <GoalsView />;
}
