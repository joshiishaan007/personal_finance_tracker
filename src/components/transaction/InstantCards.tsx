'use client';

import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInstantCards, useDeleteInstantCard, type InstantCard } from '@/hooks/useInstantCards';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { Text } from '@/components/ui/Text';
import { fmt, cn } from '@/lib/utils';
import type { CreateTransaction } from '@/shared';

export function InstantCards() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: cards } = useInstantCards();
  const { data: categories } = useCategories();
  const createTx = useCreateTransaction();
  const deleteCard = useDeleteInstantCard();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  if (!cards || cards.length === 0) return null;

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c._id, c]));

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

  return (
    <div className="space-y-2">
      <Text variant="small" className="flex items-center gap-1.5 font-medium">
        <Zap size={13} strokeWidth={2.4} className="text-brand-500" /> Instant add
      </Text>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {cards.map((card) => {
          const cat = catMap[card.categoryId];
          const isPending = pendingId === card._id;
          return (
            <div key={card._id} className="relative shrink-0 group">
              <button
                type="button"
                disabled={createTx.isPending}
                onClick={() => add(card)}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[76px] max-w-[96px] rounded-2xl px-3 py-2.5',
                  'bg-white dark:bg-ink-800 border border-slate-200/80 dark:border-white/10',
                  'hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md',
                  'transition-all active:scale-95 select-none',
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
                <Text as="span" className="text-[9px] text-slate-400 uppercase tracking-wide">
                  {card.paymentMethod}
                </Text>
              </button>
              {/* Delete handle — shows on hover */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); deleteCard.mutate(card._id); }}
                className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-danger-500 text-white shadow hover:bg-danger-600 transition-colors"
                aria-label="Remove instant card"
              >
                <X size={9} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>
      <ConfettiBurst trigger={celebrate} />
    </div>
  );
}
