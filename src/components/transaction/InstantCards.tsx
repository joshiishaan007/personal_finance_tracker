'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Zap, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInstantCards, useReorderInstantCards, type InstantCard } from '@/hooks/useInstantCards';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { TransactionForm } from '@/components/transaction/TransactionForm';
import { Text } from '@/components/ui/Text';
import { fmt, cn } from '@/lib/utils';
import type { CreateTransaction } from '@/shared';

// dnd-kit only loads once the user enters edit mode — keeps it off the hot
// dashboard/transactions render path.
const InstantCardsEditor = dynamic(
  () => import('./InstantCardsEditor').then((m) => m.InstantCardsEditor),
  { ssr: false },
);

const CARD_BOX = 'flex flex-col items-center gap-1 min-w-[80px] max-w-[100px] rounded-2xl px-3 py-2.5 border shrink-0';

export function InstantCards() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const { data: cards } = useInstantCards();
  const { data: categories } = useCategories();
  const createTx = useCreateTransaction();
  const reorder = useReorderInstantCards();

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [cardForm, setCardForm] = useState<{ open: boolean; editCard: InstantCard | null }>({ open: false, editCard: null });

  // While editing, keep the working order in sync with the live cards: append any
  // newly-added ids, drop deleted ones, preserve the user's arrangement.
  useEffect(() => {
    if (!editing || !cards) return;
    setOrder((prev) => {
      const ids = cards.map((c) => c._id);
      const kept = prev.filter((id) => ids.includes(id));
      const added = ids.filter((id) => !kept.includes(id));
      return [...kept, ...added];
    });
  }, [editing, cards]);

  if (!cards || cards.length === 0) return null;

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c._id, c]));

  const orderedCards = editing
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
      onSuccess: () => { setCelebrate(true); setTimeout(() => setCelebrate(false), 1400); },
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

  return (
    <div className="space-y-2">
      <Text variant="small" className="flex items-center gap-1.5 font-medium">
        <Zap size={13} strokeWidth={2.4} className="text-brand-500" /> Instant add
      </Text>

      {editing ? (
        <InstantCardsEditor
          cards={orderedCards}
          catMap={catMap}
          currency={currency}
          onReorder={setOrder}
          onEditCard={(card) => setCardForm({ open: true, editCard: card })}
          onAdd={() => setCardForm({ open: true, editCard: null })}
          onDone={done}
          reordering={reorder.isPending}
        />
      ) : (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {orderedCards.map((card) => {
            const cat = catMap[card.categoryId];
            const isPending = pendingId === card._id;
            return (
              <button
                key={card._id}
                type="button"
                disabled={createTx.isPending}
                onClick={() => add(card)}
                className={cn(
                  CARD_BOX,
                  'bg-white dark:bg-ink-800 border-slate-200/80 dark:border-white/10 select-none transition-all',
                  'hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md active:scale-95',
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
                <Text as="span" className="text-[9px] text-slate-400 uppercase tracking-wide">{card.paymentMethod}</Text>
              </button>
            );
          })}

          <button
            type="button"
            onClick={startEdit}
            className={cn(CARD_BOX, 'justify-center gap-1.5 border-dashed border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400 hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-400 active:scale-95 transition-all')}
            aria-label="Edit instant cards"
          >
            <Pencil size={16} strokeWidth={2.4} />
            <Text as="span" className="text-[11px] font-semibold text-current">Edit</Text>
          </button>
        </div>
      )}

      <ConfettiBurst trigger={celebrate} />

      <TransactionForm
        open={cardForm.open}
        onClose={() => setCardForm({ open: false, editCard: null })}
        categories={categories ?? []}
        cardMode
        editCard={cardForm.editCard}
      />
    </div>
  );
}
