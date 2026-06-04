'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertTriangle, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AllocationBucket, BucketComputed } from '@/shared';
import { useCategories } from '@/hooks/useCategories';
import { useUpdateSpendingPlan } from '@/hooks/useSpendingPlan';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Label } from '@/components/ui/Label';

interface Props {
  open: boolean;
  onClose: () => void;
  buckets: BucketComputed[];
  assignments: Record<string, string>;
}

const KIND_OPTIONS = [
  { value: 'needs', label: 'Needs' },
  { value: 'wants', label: 'Wants' },
  { value: 'savings', label: 'Savings' },
  { value: 'custom', label: 'Custom' },
];

// Strip computed fields back down to the persisted bucket shape.
function toBucket(b: BucketComputed | AllocationBucket): AllocationBucket {
  return { id: b.id, name: b.name, percent: b.percent, color: b.color, kind: b.kind };
}

export function PlanEditor({ open, onClose, buckets: initial, assignments: initialAssign }: Props) {
  const { data: categories } = useCategories();
  const update = useUpdateSpendingPlan();

  const [buckets, setBuckets] = useState<AllocationBucket[]>(() => initial.map(toBucket));
  const [assignments, setAssignments] = useState<Record<string, string>>(() => ({ ...initialAssign }));

  const total = buckets.reduce((s, b) => s + (Number.isFinite(b.percent) ? b.percent : 0), 0);
  const planCats = (categories ?? []).filter((c) => c.type === 'expense' || c.type === 'investment');
  // Separate unassigned (need attention) from already-assigned for the sorted list.
  const unassigned = planCats.filter((c) => !assignments[c._id]);
  const assigned = planCats.filter((c) => !!assignments[c._id]);

  function patchBucket(id: string, patch: Partial<AllocationBucket>) {
    setBuckets((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function addBucket() {
    setBuckets((bs) => [
      ...bs,
      { id: crypto.randomUUID(), name: 'New bucket', percent: 0, color: '#6366F1', kind: 'custom' },
    ]);
  }

  function removeBucket(id: string) {
    setBuckets((bs) => bs.filter((b) => b.id !== id));
    // Drop assignments pointing at the removed bucket.
    setAssignments((a) => Object.fromEntries(Object.entries(a).filter(([, v]) => v !== id)));
  }

  function assign(categoryId: string, bucketId: string) {
    setAssignments((a) => {
      const next = { ...a };
      if (bucketId) next[categoryId] = bucketId;
      else delete next[categoryId];
      return next;
    });
  }

  function onSave() {
    update.mutate(
      { buckets, assignments },
      { onSuccess: () => onClose() },
    );
  }

  const bucketOptions = [
    { value: '', label: 'Unassigned' },
    ...buckets.map((b) => ({ value: b.id, label: b.name })),
  ];

  return (
    <Modal open={open} onClose={onClose} title="Edit spending plan" className="max-w-lg">
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Heading level={5}>Buckets</Heading>
            <Badge variant={total === 100 ? 'success' : 'warn'} className="gap-1">
              {total !== 100 && <AlertTriangle size={11} strokeWidth={2.4} />}
              {total}% allocated
            </Badge>
          </div>

          <div className="space-y-3">
            {buckets.map((b) => (
              <div key={b.id} className="flex items-end gap-2">
                <Input
                  type="color"
                  aria-label={`${b.name} color`}
                  value={b.color}
                  onChange={(e) => patchBucket(b.id, { color: e.target.value })}
                  className="h-10 w-10 shrink-0 cursor-pointer p-1"
                />
                <div className="flex-1 min-w-0">
                  <Input
                    aria-label="Bucket name"
                    value={b.name}
                    onChange={(e) => patchBucket(b.id, { name: e.target.value })}
                  />
                </div>
                <div className="w-20 shrink-0">
                  <Input
                    aria-label="Percent"
                    type="number"
                    min={0}
                    max={100}
                    value={b.percent}
                    onChange={(e) => patchBucket(b.id, { percent: e.target.valueAsNumber || 0 })}
                  />
                </div>
                <div className="w-28 shrink-0">
                  <Select
                    aria-label="Kind"
                    options={KIND_OPTIONS}
                    value={b.kind}
                    onChange={(e) => patchBucket(b.id, { kind: e.target.value as AllocationBucket['kind'] })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBucket(b.id)}
                  className="shrink-0 p-2 text-slate-400 hover:text-danger-500"
                  aria-label="Remove bucket"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={addBucket}
            leftIcon={<Plus size={16} strokeWidth={2.4} />}
            disabled={buckets.length >= 12}
          >
            Add bucket
          </Button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Heading level={5}>Assign categories</Heading>
            {unassigned.length > 0 && (
              <Badge variant="warn" className="gap-1 shrink-0">
                <AlertTriangle size={11} strokeWidth={2.4} />
                {unassigned.length} unassigned
              </Badge>
            )}
          </div>

          {/* Split-category tip — shown when any unassigned categories exist */}
          {unassigned.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 p-3">
              <SplitSquareHorizontal size={16} className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400" />
              <Text variant="small" className="text-brand-700 dark:text-brand-300">
                <Text as="span" className="font-semibold text-brand-700 dark:text-brand-300">Tip: </Text>
                If a category covers both needs and wants (e.g. &quot;Food &amp; Dining&quot;), create two separate
                categories — &quot;Food&quot; → Needs and &quot;Dining Out&quot; → Wants — and use those for new
                transactions. Tag each one to the right bucket here.
              </Text>
            </div>
          )}

          {planCats.length === 0 ? (
            <Text variant="muted">No expense or investment categories yet.</Text>
          ) : (
            <div className="space-y-2">
              {/* Unassigned categories float to the top so they're hard to miss */}
              {[...unassigned, ...assigned].map((c) => (
                <Label key={c._id} className="flex items-center justify-between gap-3 font-normal">
                  <div className="flex items-center gap-2 min-w-0">
                    {!assignments[c._id] && (
                      <div className="w-1.5 h-1.5 rounded-full bg-warn-500 shrink-0" aria-hidden />
                    )}
                    <Text as="span" className="truncate">
                      {c.icon} {c.name}
                    </Text>
                  </div>
                  <div className="w-40 shrink-0">
                    <Select
                      aria-label={`Bucket for ${c.name}`}
                      options={bucketOptions}
                      value={assignments[c._id] ?? ''}
                      onChange={(e) => assign(c._id, e.target.value)}
                    />
                  </div>
                </Label>
              ))}
            </div>
          )}
        </section>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            loading={update.isPending}
            className={cn('flex-1')}
          >
            Save plan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
