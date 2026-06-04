import { GoalDetailView } from '@/components/goal-mgmt/GoalDetailView';

export default function GoalDetailPage({ params }: { params: { id: string } }) {
  return <GoalDetailView goalId={params.id} />;
}
