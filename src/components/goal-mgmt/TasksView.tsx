'use client';

import { useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, type Task } from '@/hooks/useTasks';
import { TaskItem } from '@/components/goal-mgmt/TaskItem';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { cn } from '@/lib/utils';

const FILTERS: { key: string; label: string; query: Record<string, string> }[] = [
  { key: 'all', label: 'All', query: {} },
  { key: 'open', label: 'Open', query: { done: 'false' } },
  { key: 'overdue', label: 'Overdue', query: { scope: 'overdue' } },
];

export function TasksView() {
  const [filterKey, setFilterKey] = useState('all');
  const [title, setTitle] = useState('');

  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0]!;
  const { data: tasks, isLoading } = useTasks(filter.query);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  function add() {
    const t = title.trim();
    if (!t || createTask.isPending) return;
    createTask.mutate({ title: t, done: false, priority: 'med' }, { onSuccess: () => setTitle('') });
  }

  const items: Task[] = tasks ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <div>
        <Heading level={1} className="text-2xl">Tasks</Heading>
        <Text variant="small" className="mt-0.5">Day-to-day to-dos toward your goals</Text>
      </div>

      <Card padding="sm">
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex items-center gap-2">
          <div className="flex-1">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a task…" aria-label="New task" />
          </div>
          <Button type="submit" size="sm" variant="gradient" loading={createTask.isPending} disabled={!title.trim()} leftIcon={<Plus size={16} strokeWidth={2.4} />}>
            Add
          </Button>
        </form>
      </Card>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filterKey === f.key ? 'primary' : 'secondary'}
            className={cn('px-3', filterKey !== f.key && 'bg-white/60 dark:bg-ink-800/60')}
            onClick={() => setFilterKey(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonLoader rows={6} />
      ) : items.length === 0 ? (
        <EmptyState icon={ListChecks} title="No tasks here" description="Add a task above to get started." />
      ) : (
        <div className="space-y-2">
          {items.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onToggle={() => updateTask.mutate({ id: task._id, data: { done: !task.done } })}
              onDelete={() => deleteTask.mutate(task._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
