'use client';

import { useState } from 'react';
import { Zap, Pencil, Check, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useInstantCards, useDeleteInstantCard, useReorderInstantCards, type InstantCard,
} from '@/hooks/useInstantCards';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { Text } from '@/components/ui/Text';
import { fmt, cn } from '@/lib/utils';
import type { CreateTransaction } from '@/shared';

const CARD_BOX = 'flex flex-col items-center gap-1 min-w-[80px] max-w-[100px] rounded-2xl px-3 py-2.5 border';

export function InstantCards() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: cards } = useInstantCards();
  const { data: categories } = useCategories();
  const createTx = useCreateTransaction();
  const deleteCard = useDeleteInstantCard();
  const reorder = useReorderInstantCards();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [editing, setEditing] = useState(false);
  // Local working order while editing; persisted on Done.
  const [order, setOrder] = useState<string[]>([]);

  if (!cards || cards.length === 0) return null;

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c._id, c]));

  // While editing, render from the local order; otherwise the server order.
  const displayCards = editing
    ? order.map((id) => cards.find((c) => c._id === id)).filter((c): c is InstantCard => !!c)
    : cards;

  function add(card: InstantCard) {
    if (createTx.isPending) return;
    setPendingId(card._id);
    const payload: CreateTransaction = {
      amount:        card.amount,
      type:          card.type as CreateTransaction['type'],
      categoryId:    card.categoryId,
      paymentMethod: card.paymentMethod as CreateTransaction['paymentMethod'],
      date:          new Date().toISOString(),
      note:          card.note,
      tags:          card.tags,
      isRecurring:   false,
    };
    createTx.mutate(payload, {
      onSuccess: () => {
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 1400);
      },
      onSettled: () => setPendingId(null),
    });
  }

  function startEdit() {
    setOrder(cards!.map((c) => c._id));
    setEditing(true);
  }

  function done() {
    const live = order.filter((id) => cards!.some((c) => c._id === id));
    if (live.length) reorder.mutate(live);
    setEditing(false);
  }

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });
  }

  function removeCard(id: string) {
    deleteCard.mutate(id);
    setOrder((prev) => prev.filter((x) => x !== id));
  }

  return (
    <div className="space-y-2">
      <Text variant="small" className="flex items-center gap-1.5 font-medium">
        <Zap size={13} strokeWidth={2.4} className="text-brand-500" /> Instant add
      </Text>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {displayCards.map((card, idx) => {
          const cat = catMap[card.categoryId];
          const isPending = pendingId === card._id;
          return (
            <div key={card._id} className="relative shrink-0">
              <button
                type="button"
                disabled={editing || createTx.isPending}
                onClick={() => add(card)}
                className={cn(
                  CARD_BOX,
                  'bg-white dark:bg-ink-800 border-slate-200/80 dark:border-white/10 select-none transition-all',
                  editing
                    ? 'cursor-default ring-2 ring-brand-200 dark:ring-brand-800/70'
                    : 'hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md active:scale-95',
                  isPending && 'opacity-60 pointer-events-none',
                )}
              >
                <Text as="span" className="text-xl leading-none">{cat?.icon ?? '💰'}</Text>
                <Text as="span" className="text-xs font-bold tabular-nums text-slate-900 dark:text-slate-50 leading-tight">
                  {fmt(card.amount, currency)}
                </Text>
                <Text as="span" className="text-[10px] text-slate-500 truncate w-full text-center leading-tight">
                  {cat?.name ?? 'Card'}
                </Text>
                {editing ? (
                  <div className="mt-0.5 flex items-center justify-between gap-1 w-full">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={(e) => { e.stopPropagation(); move(card._id, -1); }}
                      className="grid place-items-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-ink-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-90 transition-transform"
                      aria-label="Move left"
                    >
                      <ChevronLeft size={14} strokeWidth={2.6} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === displayCards.length - 1}
                      onClick={(e) => { e.stopPropagation(); move(card._id, 1); }}
                      className="grid place-items-center w-6 h-6 rounded-lg bg-slate-100 dark:bg-ink-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-90 transition-transform"
                      aria-label="Move right"
                    >
                      <ChevronRight size={14} strokeWidth={2.6} />
                    </button>
                  </div>
                ) : (
                  <Text as="span" className="text-[9px] text-slate-400 uppercase tracking-wide">
                    {card.paymentMethod}
                  </Text>
                )}
              </button>

              {editing && (
                <button
                  type="button"
                  onClick={() => removeCard(card._id)}
                  className="absolute -top-1.5 -right-1.5 grid place-items-center w-5 h-5 rounded-full bg-danger-500 text-white shadow-sm hover:bg-danger-600 active:scale-90 transition-transform"
                  aria-label={`Remove ${cat?.name ?? 'card'}`}
                >
                  <Trash2 size={11} strokeWidth={2.4} />
                </button>
              )}
            </div>
          );
        })}

        {/* End control — Edit normally, Done while editing */}
        <button
          type="button"
          onClick={editing ? done : startEdit}
          disabled={reorder.isPending}
          className={cn(
            CARD_BOX,
            'shrink-0 justify-center gap-1.5 active:scale-95 transition-all',
            editing
              ? 'border-brand-400 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-700'
              : 'border-dashed border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400',
          )}
          aria-label={editing ? 'Done editing instant cards' : 'Edit instant cards'}
        >
          {editing ? <Check size={18} strokeWidth={2.6} /> : <Pencil size={16} strokeWidth={2.4} />}
          <Text as="span" className="text-[11px] font-semibold text-current">{editing ? 'Done' : 'Edit'}</Text>
        </button>
      </div>
      <ConfettiBurst trigger={celebrate} />
    </div>
  );
}
