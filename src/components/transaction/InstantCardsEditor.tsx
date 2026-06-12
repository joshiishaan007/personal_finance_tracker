'use client';

import {
  DndContext, MouseSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
  closestCenter, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Check } from 'lucide-react';
import { fmt, cn } from '@/lib/utils';
import { Text } from '@/components/ui/Text';
import type { InstantCard } from '@/hooks/useInstantCards';
import type { Category } from '@/hooks/useCategories';

const CARD_BOX = 'flex flex-col items-center gap-1 min-w-[80px] max-w-[100px] rounded-2xl px-3 py-2.5 border shrink-0';

interface Props {
  cards:      InstantCard[];
  catMap:     Record<string, Category>;
  currency:   string;
  onReorder:  (ids: string[]) => void;
  onEditCard: (card: InstantCard) => void;
  onAdd:      () => void;
  onDone:     () => void;
  reordering: boolean;
}

function SortableCard({ card, cat, currency, onEdit }: {
  card: InstantCard; cat?: Category; currency: string; onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card._id });
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      type="button"
      onClick={onEdit}
      className={cn(
        CARD_BOX,
        'select-none bg-white dark:bg-ink-800 border-brand-200 dark:border-brand-800/70 ring-2 ring-brand-100 dark:ring-brand-900/50 cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-70 shadow-card-lg z-10',
      )}
      aria-label={`Edit ${cat?.name ?? 'card'} — drag to reorder`}
      {...attributes}
      {...listeners}
    >
      <Text as="span" className="text-xl leading-none">{cat?.icon ?? '💰'}</Text>
      <Text as="span" className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-50 leading-tight">
        {fmt(card.amount, currency)}
      </Text>
      <Text as="span" className="text-[10px] text-slate-500 truncate w-full text-center leading-tight">
        {cat?.name ?? 'Card'}
      </Text>
      <Text as="span" className="text-[9px] text-slate-400 uppercase tracking-wide">{card.paymentMethod}</Text>
    </button>
  );
}

export function InstantCardsEditor({ cards, catMap, currency, onReorder, onEditCard, onAdd, onDone, reordering }: Props) {
  // Mouse: drag after 8px. Touch: press-hold ~180ms so a quick swipe still scrolls
  // the row and a tap still edits. Keyboard for accessibility.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = cards.map((c) => c._id);

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {cards.map((c) => (
            <SortableCard key={c._id} card={c} cat={catMap[c.categoryId]} currency={currency} onEdit={() => onEditCard(c)} />
          ))}

          <button
            type="button"
            onClick={onAdd}
            className={cn(CARD_BOX, 'justify-center gap-1.5 border-dashed border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400 active:scale-95 transition-all')}
            aria-label="Add instant card"
          >
            <Plus size={18} strokeWidth={2.4} />
            <Text as="span" className="text-[11px] font-semibold text-current">Add</Text>
          </button>

          <button
            type="button"
            onClick={onDone}
            disabled={reordering}
            className={cn(CARD_BOX, 'justify-center gap-1.5 border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-700 active:scale-95 transition-all')}
            aria-label="Done editing instant cards"
          >
            <Check size={18} strokeWidth={2.6} />
            <Text as="span" className="text-[11px] font-semibold text-current">Done</Text>
          </button>
        </div>
      </SortableContext>
    </DndContext>
  );
}
