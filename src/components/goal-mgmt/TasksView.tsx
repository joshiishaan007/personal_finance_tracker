'use client';

import { useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, type Task } from '@/hooks/useTasks';
import type { TaskPriority } from '@/shared';
import { TaskItem } from '@/components/goal-mgmt/TaskItem';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';

const FILTERS: { key: string; label: string; query: Record<string, string> }[] = [
  { key: 'all',     label: 'All',       query: {} },
  { key: 'today',   label: 'Today',     query: { scope: 'today' } },
  { key: 'week',    label: 'This week', query: { scope: 'week' } },
  { key: 'open',    label: 'Open',      query: { done: 'false' } },
  { key: 'overdue', label: 'Overdue',   query: { scope: 'overdue' } },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: '🔴 High' },
  { value: 'med',  label: '🟡 Med'  },
  { value: 'low',  label: '🟢 Low'  },
];

// Combine a date string and optional time string into an ISO datetime.
// No time → end of day (23:59) so overdue kicks in after midnight.
function buildDueIso(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const d = new Date(date);
  const [h, m] = (time || '23:59').split(':').map(Number);
  d.setHours(h!, m!, 0, 0);
  return d.toISOString();
}

export function TasksView() {
  const [filterKey,    setFilterKey]    = useState('all');
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [title, setTitle]         = useState('');
  const [priority, setPriority]   = useState<TaskPriority>('med');
  const [dueDate, setDueDate]     = useState('');
  const [dueTime, setDueTime]     = useState('');

  const filter = FILTERS.find((f) => f.key === filterKey) ?? FILTERS[0]!;
  const { data: tasks, isLoading } = useTasks(filter.query);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  function add() {
    const t = title.trim();
    if (!t || createTask.isPending) return;
    createTask.mutate(
      {
        title:    t,
        done:     false,
        priority,
        dueDate:  buildDueIso(dueDate, dueTime),
      },
      {
        onSuccess: () => {
          setTitle('');
          setDueDate('');
          setDueTime('');
        },
      },
    );
  }

  const items: Task[] = tasks ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <div>
        <Heading level={1} className="text-2xl">Tasks</Heading>
        <Text variant="small" className="mt-0.5 text-slate-500">Day-to-day to-dos toward your goals</Text>
      </div>

      {/* Add task form */}
      <Card padding="sm">
        <form onSubmit={(e) => { e.preventDefault(); add(); }} className="space-y-2">
          {/* Title + priority + submit */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a task…"
                aria-label="New task title"
              />
            </div>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              options={PRIORITY_OPTIONS}
              className="w-28 shrink-0"
              aria-label="Priority"
            />
            <Button
              type="submit"
              size="sm"
              variant="gradient"
              loading={createTask.isPending}
              disabled={!title.trim()}
              leftIcon={<Plus size={15} strokeWidth={2.4} />}
              className="shrink-0"
            >
              Add
            </Button>
          </div>

          {/* Due date + time (optional) */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DatePicker
                value={dueDate}
                onChange={(v) => { setDueDate(v); if (!v) setDueTime(''); }}
                placeholder="Due date (optional)"
              />
            </div>
            <div className="w-36 shrink-0">
              <TimePicker
                value={dueTime}
                onChange={setDueTime}
                disabled={!dueDate}
              />
            </div>
          </div>
        </form>
      </Card>

      {/* Day-wise + status filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filterKey === f.key ? 'primary' : 'secondary'}
            className={cn(
              'px-3 shrink-0',
              filterKey !== f.key && 'bg-white/60 dark:bg-ink-800/60',
            )}
            onClick={() => setFilterKey(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Task list */}
      {isLoading ? (
        <SkeletonLoader rows={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={filterKey === 'overdue' ? 'No overdue tasks' : filterKey === 'today' ? 'Nothing due today' : filterKey === 'week' ? 'Nothing due this week' : 'No tasks here'}
          description={filterKey === 'all' || filterKey === 'open' ? 'Add a task above to get started.' : 'You\'re all caught up!'}
        />
      ) : (
        <div className="space-y-2">
          {items.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onToggle={() => updateTask.mutate({ id: task._id, data: { done: !task.done } })}
              onDelete={() => setDeleteTaskId(task._id)}
            />
          ))}
        </div>
      )}
    <ConfirmDialog
      open={!!deleteTaskId}
      onClose={() => setDeleteTaskId(null)}
      onConfirm={() => deleteTask.mutate(deleteTaskId!)}
      title="Delete task?"
      description="This task will be permanently removed."
      loading={deleteTask.isPending}
    />
    </div>
  );
}
