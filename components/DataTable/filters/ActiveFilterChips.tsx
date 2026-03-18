'use client';
'use no memo';

import { type Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { generateChipLabel } from '~/components/DataTable/filters/chipLabels';
import { type OperatorFilterValue } from '~/components/DataTable/filters/types';
import Button from '~/components/ui/Button';

type ActiveFilterChipsProps<TData> = {
  table: Table<TData>;
};

export default function ActiveFilterChips<TData>({
  table,
}: ActiveFilterChipsProps<TData>) {
  const columnFilters = table.getState().columnFilters;

  const chips: {
    key: string;
    label: string;
    onRemove: () => void;
  }[] = [];

  for (const filter of columnFilters) {
    const column = table.getColumn(filter.id);
    if (!column) continue;

    const config = column.columnDef.meta?.filterConfig;
    if (!config) continue;

    const title = filter.id;
    const result = generateChipLabel(title, config, filter.value);

    if (Array.isArray(result)) {
      const value = filter.value as OperatorFilterValue;
      result.forEach((label, index) => {
        chips.push({
          key: `${filter.id}-${String(index)}`,
          label,
          onRemove: () => {
            const remaining = value.conditions.filter((_, i) => i !== index);
            if (remaining.length === 0) {
              column.setFilterValue(undefined);
            } else {
              column.setFilterValue({ conditions: remaining });
            }
          },
        });
      });
    } else {
      chips.push({
        key: filter.id,
        label: result,
        onRemove: () => column.setFilterValue(undefined),
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <AnimatePresence mode="popLayout">
        {chips.map((chip) => (
          <motion.span
            key={chip.key}
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.3 }}
            className="bg-surface-1 text-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
          >
            {chip.label}
            <button
              type="button"
              onClick={chip.onRemove}
              className="text-muted-foreground hover:text-foreground -mr-1 rounded-full p-0.5 transition-colors"
              aria-label={`Remove filter: ${chip.label}`}
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
        {chips.length > 1 && (
          <motion.div
            key="clear-all"
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.3 }}
          >
            <Button
              size="sm"
              variant="text"
              onClick={() => table.resetColumnFilters()}
            >
              Clear all
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
