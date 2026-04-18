import { useState } from 'react';

export const DEFAULT_FILTERS = {
  type:          'ALL',
  dateRange:     'ALL',
  startDate:     '',
  endDate:       '',
  minPoints:     0,
  maxPoints:     999,
};

export function useTransactionFilters() {
  const [draft,   setDraft]   = useState({ ...DEFAULT_FILTERS });
  const [applied, setApplied] = useState({ ...DEFAULT_FILTERS });

  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));

  const reset  = ()        => setDraft({ ...DEFAULT_FILTERS });
  const apply  = (onClose) => { setApplied({ ...draft }); onClose(); };
  const cancel = (onClose) => { setDraft({ ...applied }); onClose(); };

  // Remove a single chip by key (or reset all when key is undefined)
  const clearOne = (key) => {
    if (!key) { reset(); return; }
    const patch = {
      type:      { type: DEFAULT_FILTERS.type },
      date:      { dateRange: DEFAULT_FILTERS.dateRange, startDate: DEFAULT_FILTERS.startDate, endDate: DEFAULT_FILTERS.endDate },
      points:    { minPoints: DEFAULT_FILTERS.minPoints, maxPoints: DEFAULT_FILTERS.maxPoints },
    }[key] ?? {};
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  return { draft, applied, set, reset, apply, cancel, clearOne };
}

/* ── Derive active filter chips from draft (no extra state) ── */
const DATE_LABELS = {
  TODAY:   'Today',
  '7_DAYS':  'Last 7 Days',
  '30_DAYS': 'Last 30 Days',
  CUSTOM:  'Custom Range',
};

export function buildActiveFilters(draft) {
  const chips = [];

  if (draft.type !== 'ALL')
    chips.push({ key: 'type', label: `Type: ${draft.type.charAt(0) + draft.type.slice(1).toLowerCase()}` });

  if (draft.dateRange !== 'ALL') {
    const label = draft.dateRange === 'CUSTOM' && draft.startDate && draft.endDate
      ? `${draft.startDate} → ${draft.endDate}`
      : DATE_LABELS[draft.dateRange];
    if (label) chips.push({ key: 'date', label });
  }

  if (Number(draft.minPoints) !== 0 || Number(draft.maxPoints) !== 999)
    chips.push({ key: 'points', label: `Points: ${draft.minPoints}–${draft.maxPoints}` });

  return chips;
}

/* ── Pure filter function (used in Transactions.jsx) ── */
export function applyFilters(transactions, filters) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return transactions.filter((t) => {
    // Type
    if (filters.type !== 'ALL' && t.type !== filters.type) return false;

    // Date range
    if (filters.dateRange !== 'ALL') {
      const txDate = new Date(t.date);
      if (filters.dateRange === 'TODAY') {
        if (txDate.toDateString() !== today.toDateString()) return false;
      } else if (filters.dateRange === '7_DAYS') {
        const cutoff = new Date(today); cutoff.setDate(today.getDate() - 7);
        if (txDate < cutoff) return false;
      } else if (filters.dateRange === '30_DAYS') {
        const cutoff = new Date(today); cutoff.setDate(today.getDate() - 30);
        if (txDate < cutoff) return false;
      } else if (filters.dateRange === 'CUSTOM') {
        if (filters.startDate && txDate < new Date(filters.startDate)) return false;
        if (filters.endDate   && txDate > new Date(filters.endDate))   return false;
      }
    }

    // Points range — use absolute value so negative redeemed points are included
    const abs = Math.abs(t.points);
    if (abs < Number(filters.minPoints) || abs > Number(filters.maxPoints)) return false;

    return true;
  });
}
