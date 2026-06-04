'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Plus, ListChecks } from 'lucide-react';
import { useLifeGoal, useDeleteLifeGoal, lifeGoalProgress } from '@/hooks/useLifeGoals';
import { useContributions, useAddContribution, useDeleteContribution } from '@/hooks/useContributions';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { LifeGoalForm } from '@/components/goal-mgmt/LifeGoalForm';
import { TaskItem } from '@/components/goal-mgmt/TaskItem';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Link } from '@/components/ui/Link';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { fmtDate } from '@/lib/utils';

export function GoalDetailView({ goalId }: { goalId: string }) {
  const router = useRouter();
  const { data: goal, isLoading } = useLifeGoal(goalId);

  const { data: contributions } = useContributions(goalId);
  const addContribution = useAddContribution(goalId);
  const delContribution = useDeleteContribution(goalId);
  const { data: tasks } = useTasks({ goalId });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const deleteGoal = useDeleteLifeGoal();

  const [editOpen, setEditOpen] = useState(false);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  if (isLoading) return <div className="mx-auto max-w-3xl p-4 lg:p-6"><SkeletonLoader rows={6} /></div>;
  if (!goal) {
    return (
      <div className="mx-auto max-w-3xl p-4 lg:p-6">
        <EmptyState title="Goal not found" action={{ label: 'Back to Goals', onClick: () => router.push('/goals') }} />
      </div>
    );
  }

  const pct = lifeGoalProgress(goal);

  function logProgress() {
    if (!goal || addContribution.isPending) return;
    const v = value.trim() ? Number(value) : 1;
    addContribution.mutate(
      { goalId, value: v, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setValue('');
          setNote('');
          if (lifeGoalProgress({ ...goal, currentValue: goal.currentValue + v }) >= 100) {
            setCelebrate(true);
            setTimeout(() => setCelebrate(false), 2000);
          }
        },
      },
    );
  }

  function addTask() {
    const t = taskTitle.trim();
    if (!t || createTask.isPending) return;
    createTask.mutate({ title: t, done: false, priority: 'med', goalId }, { onSuccess: () => setTaskTitle('') });
  }

  function removeGoal() {
    if (confirm('Delete this goal? Its progress log will be removed too.')) {
      deleteGoal.mutate(goalId, { onSuccess: () => router.push('/goals') });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <Link href="/goals" className="inline-flex items-center gap-1 text-sm no-underline">
        <ArrowLeft size={15} strokeWidth={2.4} /> Goals
      </Link>

      {/* Header + progress */}
      <Card variant="gradient">
        <div className="flex items-center gap-4">
          <ProgressRing pct={pct} size={72} color={goal.color} />
          <div className="min-w-0 flex-1">
            <Heading level={3} className="truncate">{goal.icon} {goal.title}</Heading>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="brand">{goal.area}</Badge>
              {goal.targetValue ? (
                <Text variant="small" className="tabular-nums">{goal.currentValue}/{goal.targetValue} {goal.unit ?? ''}</Text>
              ) : null}
              {goal.targetDate && <Text variant="small">by {fmtDate(goal.targetDate)}</Text>}
            </div>
            {goal.description && <Text variant="small" className="mt-2">{goal.description}</Text>}
          </div>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="sm" className="min-h-0 p-2" onClick={() => setEditOpen(true)} aria-label="Edit goal"><Pencil size={16} /></Button>
            <Button variant="ghost" size="sm" className="min-h-0 p-2 hover:text-danger-500" onClick={removeGoal} aria-label="Delete goal"><Trash2 size={16} /></Button>
          </div>
        </div>
      </Card>

      {/* Log progress */}
      <Card>
        <Heading level={5}>Log progress</Heading>
        <form onSubmit={(e) => { e.preventDefault(); logProgress(); }} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder={goal.unit ? `+ ${goal.unit}` : '+1'} className="sm:w-28" aria-label="Progress amount" />
          <div className="flex-1"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" aria-label="Progress note" /></div>
          <Button type="submit" variant="gradient" loading={addContribution.isPending} leftIcon={<Plus size={16} strokeWidth={2.4} />}>Log</Button>
        </form>
        <div className="mt-4 space-y-1.5">
          {(contributions ?? []).length === 0 ? (
            <Text variant="small">No progress logged yet.</Text>
          ) : (
            (contributions ?? []).map((c) => (
              <div key={c._id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-ink-800/50">
                <Text as="span" className="text-sm font-semibold tabular-nums text-brand-600 dark:text-brand-300">+{c.value}</Text>
                <div className="min-w-0 flex-1">
                  <Text className="truncate text-sm">{c.note ?? 'Progress'}</Text>
                  <Text variant="small">{fmtDate(c.date)}</Text>
                </div>
                <Button variant="ghost" size="sm" className="min-h-0 p-1 hover:text-danger-500 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => delContribution.mutate(c._id)} aria-label="Delete entry">
                  <Trash2 size={14} />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Linked tasks */}
      <Card>
        <Heading level={5}>Tasks</Heading>
        <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="mt-3 flex items-center gap-2">
          <div className="flex-1"><Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a task for this goal…" aria-label="New task" /></div>
          <Button type="submit" size="sm" variant="secondary" loading={createTask.isPending} disabled={!taskTitle.trim()} leftIcon={<Plus size={15} strokeWidth={2.4} />}>Add</Button>
        </form>
        <div className="mt-3 space-y-2">
          {(tasks ?? []).length === 0 ? (
            <Text variant="small" className="flex items-center gap-1.5"><ListChecks size={14} /> No tasks linked yet.</Text>
          ) : (
            (tasks ?? []).map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={() => updateTask.mutate({ id: task._id, data: { done: !task.done } })}
                onDelete={() => deleteTask.mutate(task._id)}
              />
            ))
          )}
        </div>
      </Card>

      <LifeGoalForm open={editOpen} onClose={() => setEditOpen(false)} editGoal={goal} />
      <ConfettiBurst trigger={celebrate} />
    </div>
  );
}
