'use client';

import {
  parseAsArrayOf,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import { useMemo } from 'react';
import ComboboxField from '~/lib/form/components/fields/Combobox/Combobox';
import { nuqsTableUrlKey, useNuqsTable } from './NuqsTableProvider';

type NuqsFacetedFilterProps<T extends string> = {
  /** Logical param name (unprefixed). The provider's `prefix` will be applied. */
  paramKey: string;
  /** Whitelist of values this filter accepts. Used for URL parsing + options. */
  values: readonly T[];
  /** Visible label for each option. Defaults to the value itself. */
  getLabel?: (value: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
};

/**
 * URL-backed multi-select filter for server-fetched tables.
 *
 * Values are parsed via `parseAsStringLiteral(values)` so unknown URL values
 * are rejected. Writes go through the provider's `startTransition`, so the
 * table body fades concurrently without unmounting.
 */
export default function NuqsFacetedFilter<T extends string>({
  paramKey,
  values,
  getLabel = (v) => v,
  placeholder = 'Filter...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found.',
  className,
}: NuqsFacetedFilterProps<T>) {
  const { prefix, startTransition } = useNuqsTable();
  const urlKey = nuqsTableUrlKey(prefix, paramKey);

  const [selected, setSelected] = useQueryState(
    urlKey,
    parseAsArrayOf(parseAsStringLiteral(values)).withOptions({
      shallow: false,
      clearOnDefault: true,
      startTransition,
    }),
  );

  const options = useMemo(
    () => values.map((v) => ({ value: v, label: getLabel(v) })),
    [values, getLabel],
  );

  return (
    <ComboboxField
      name={urlKey}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      value={selected ?? []}
      onChange={(newValues) => {
        const next = (newValues as T[] | undefined) ?? [];
        void setSelected(next.length > 0 ? next : null);
      }}
      showSelectAll
      showDeselectAll
      className={className ?? 'w-auto shrink-0'}
    />
  );
}
