'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from '@/hooks/useCategories';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { IconPicker } from '@/components/ui/IconPicker';
import { EmptyState } from '@/components/EmptyState';

// Preset palette — 12 distinct, readable colors (no pink per design system).
const COLOR_PALETTE = [
  '#0EA5E9', '#3B82F6', '#8B5CF6', '#6366F1',
  '#10B981', '#22C55E', '#14B8A6', '#06B6D4',
  '#F59E0B', '#F97316', '#EF4444', '#64748B',
];

const TYPE_OPTIONS = [
  { value: 'expense',    label: 'Expense' },
  { value: 'income',     label: 'Income' },
  { value: 'investment', label: 'Investment' },
  { value: 'transfer',   label: 'Transfer' },
];

const TYPE_BADGE: Record<string, string> = {
  expense:    'bg-danger-50  text-danger-600  dark:bg-danger-900/30  dark:text-danger-400',
  income:     'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
  investment: 'bg-brand-50   text-brand-700   dark:bg-brand-900/30   dark:text-brand-400',
  transfer:   'bg-slate-100  text-slate-600   dark:bg-white/5        dark:text-slate-400',
};

const FormSchema = z.object({
  name:  z.string().min(1, 'Name is required').max(50),
  icon:  z.string().default('📦'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6B7280'),
  type:  z.enum(['income', 'expense', 'transfer', 'investment']),
});
type FormValues = z.infer<typeof FormSchema>;

// ---------- inline color swatch grid ----------
function ColorSwatches({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Text as="span" className="text-xs text-slate-500 dark:text-slate-400 block mb-1.5">Color</Text>
      <div className="flex flex-wrap gap-2">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={cn(
              'h-7 w-7 rounded-full border-2 transition-transform active:scale-90',
              value === c
                ? 'border-slate-900 dark:border-white scale-110'
                : 'border-transparent hover:scale-105',
            )}
            style={{ backgroundColor: c }}
            aria-label={c}
            aria-pressed={value === c}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- category form modal ----------
interface FormModalProps {
  open: boolean;
  onClose: () => void;
  edit?: Category | null;
}

function CategoryFormModal({ open, onClose, edit }: FormModalProps) {
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory(edit?._id ?? '');
  const isPending = edit ? updateCat.isPending : createCat.isPending;

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: edit
      ? { name: edit.name, icon: edit.icon, color: edit.color, type: edit.type as FormValues['type'] }
      : { name: '', icon: '📦', color: COLOR_PALETTE[0], type: 'expense' },
  });

  // Keep form in sync when switching between create / edit.
  const [lastEdit, setLastEdit] = useState<string | undefined>(edit?._id);
  if (edit?._id !== lastEdit) {
    setLastEdit(edit?._id);
    reset(
      edit
        ? { name: edit.name, icon: edit.icon, color: edit.color, type: edit.type as FormValues['type'] }
        : { name: '', icon: '📦', color: COLOR_PALETTE[0], type: 'expense' },
    );
  }

  function onSubmit(values: FormValues) {
    if (edit) {
      updateCat.mutate(values, { onSuccess: onClose });
    } else {
      createCat.mutate({ ...values, isDefault: false }, { onSuccess: onClose });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={edit ? 'Edit Category' : 'New Category'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex gap-3">
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <IconPicker label="Icon" value={field.value} onChange={field.onChange} className="w-32 shrink-0" />
            )}
          />
          <div className="flex-1">
            <Input label="Name" placeholder="e.g. Groceries" error={errors.name?.message} {...register('name')} />
          </div>
        </div>

        <Select label="Type" options={TYPE_OPTIONS} error={errors.type?.message} {...register('type')} />

        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <ColorSwatches value={field.value} onChange={field.onChange} />
          )}
        />

        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 p-3 bg-slate-50 dark:bg-ink-800/40">
          <Text as="span" className="text-xl leading-none">{watch('icon')}</Text>
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: watch('color') }}
            aria-hidden
          />
          <Text as="span" className="font-medium truncate text-slate-800 dark:text-slate-200">
            {watch('name') || 'Category name'}
          </Text>
          <Badge className={cn('ml-auto shrink-0 capitalize text-xs', TYPE_BADGE[watch('type')])}>
            {watch('type')}
          </Badge>
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={isPending} className="flex-1">
            {edit ? 'Save Changes' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- main view ----------
const TYPE_ORDER = ['expense', 'income', 'investment', 'transfer'];
const TYPE_LABEL: Record<string, string> = {
  expense: 'Expenses', income: 'Income', investment: 'Investments', transfer: 'Transfers',
};

export function CategoriesView() {
  const { data: categories, isLoading } = useCategories();
  const deleteCat = useDeleteCategory();

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);

  function openCreate() { setEditTarget(null); setFormOpen(true); }
  function openEdit(cat: Category) { setEditTarget(cat); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditTarget(null); }

  function confirmDelete() {
    if (!deleteConfirm) return;
    deleteCat.mutate(deleteConfirm._id, { onSuccess: () => setDeleteConfirm(null) });
  }

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
      </div>
    );
  }

  const grouped = TYPE_ORDER.reduce<Record<string, Category[]>>((acc, t) => {
    acc[t] = (categories ?? []).filter((c) => c.type === t);
    return acc;
  }, {});

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Heading level={2}>Categories</Heading>
        <Button onClick={openCreate} size="sm" leftIcon={<Plus size={16} strokeWidth={2.4} />}>
          New category
        </Button>
      </div>

      {(categories ?? []).length === 0 && (
        <EmptyState icon={Plus} title="No categories yet" description="Create a category to organise your transactions." />
      )}

      {TYPE_ORDER.map((type) => {
        const cats = grouped[type];
        if (!cats.length) return null;
        return (
          <section key={type} className="space-y-2">
            <Text as="span" className="text-xs uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-500 px-1">
              {TYPE_LABEL[type]}
            </Text>
            <Card variant="glass" className="divide-y divide-slate-100 dark:divide-white/5 !p-0 overflow-hidden">
              {cats.map((cat) => (
                <div key={cat._id} className="flex items-center gap-3 px-4 py-3">
                  {/* Color dot + icon */}
                  <div className="relative shrink-0">
                    <Text as="span" className="text-xl leading-none">{cat.icon}</Text>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-ink-900"
                      style={{ backgroundColor: cat.color }}
                      aria-hidden
                    />
                  </div>

                  <Text as="span" className="flex-1 font-medium text-slate-800 dark:text-slate-100 truncate">
                    {cat.name}
                  </Text>

                  {cat.isDefault && (
                    <Lock size={13} className="text-slate-300 dark:text-slate-600 shrink-0" aria-label="System default" />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(cat)}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={`Edit ${cat.name}`}
                  >
                    <Pencil size={15} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirm(cat)}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-danger-500"
                    aria-label={`Delete ${cat.name}`}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
              ))}
            </Card>
          </section>
        );
      })}

      {/* Create / Edit modal */}
      <CategoryFormModal open={formOpen} onClose={closeForm} edit={editTarget} />

      {/* Delete confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete category?">
        <div className="space-y-4">
          <Text variant="muted">
            Deleting <Text as="span" className="font-semibold text-slate-800 dark:text-slate-100">{deleteConfirm?.name}</Text> will
            remove it from all future transaction choices. Existing transactions keep their category label but it will show as unknown
            in filters. This cannot be undone.
          </Text>
          {deleteConfirm?.isDefault && (
            <div className="flex items-start gap-2 rounded-xl bg-warn-50 dark:bg-warn-800/20 p-3">
              <Lock size={15} className="mt-0.5 shrink-0 text-warn-600" />
              <Text variant="small" className="text-warn-700 dark:text-warn-400">
                This is a system default category. You can still delete it, but it may be re-created on the next seed run.
              </Text>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">Cancel</Button>
            <Button
              type="button"
              onClick={confirmDelete}
              loading={deleteCat.isPending}
              className="flex-1 bg-danger-500 hover:bg-danger-600 text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
