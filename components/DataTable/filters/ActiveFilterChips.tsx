'use no memo';
'use client';

import { type Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Button } from '~/components/ui/Button';
import { generateChipLabel } from '~/components/DataTable/filters/chipLabels';
import type { OperatorFilterValue } from '~/components/DataTable/filters/types';

const chipVariants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

function getColumnTitle<TData>(
  column: ReturnType<Table<TData>['getColumn']>,
  columnId: string,
): string {
  const header = column?.columnDef.header;
  if (typeof header === 'string') return header;
  return columnId;
}

type ActiveFilterChipsProps<TData> = {
  table: Table<TData>;
};

export function ActiveFilterChips<TData>({
  table,
}: ActiveFilterChipsProps<TData>) {
  const columnFilters = table.getState().columnFilters;

  if (columnFilters.length === 0) return null;

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

    const title = getColumnTitle(column, filter.id);
    const label = generateChipLabel(title, config, filter.value);

    if (Array.isArray(label)) {
      label.forEach((text, index) => {
        chips.push({
          key: `${filter.id}-${String(index)}`,
          label: text,
          onRemove: () => {
            const currentValue = column.getFilterValue() as
              | OperatorFilterValue
              | undefined;
            if (!currentValue) return;
            const updated = currentValue.conditions.filter(
              (_, i) => i !== index,
            );
            if (updated.length === 0) {
              column.setFilterValue(undefined);
            } else {
              column.setFilterValue({ conditions: updated });
            }
          },
        });
      });
    } else {
      chips.push({
        key: filter.id,
        label,
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
            variants={chipVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15 }}
            className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
          >
            {chip.label}
            <button
              type="button"
              onClick={chip.onRemove}
              className="hover:bg-secondary-foreground/10 ml-0.5 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => table.resetColumnFilters()}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
