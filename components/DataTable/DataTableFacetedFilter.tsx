'use client';

import { type Column } from '@tanstack/react-table';
import { useMemo } from 'react';
import { type Option } from '~/components/DataTable/types';
import ComboboxField from '~/lib/form/components/fields/Combobox/Combobox';
import { type ComboboxOption } from '~/lib/form/components/fields/Combobox/shared';

type DataTableFacetedFilterProps<TData, TValue> = {
  column?: Column<TData, TValue>;
  title?: string;
  options: Option[];
  className?: string;
};

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  className,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = (column?.getFilterValue() as string[]) ?? [];

  const comboboxOptions: ComboboxOption[] = useMemo(
    () =>
      options.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [options],
  );

  const handleChange = (newValues: (string | number)[] | undefined) => {
    if (!newValues || newValues.length === 0) {
      column?.setFilterValue(undefined);
    } else {
      column?.setFilterValue(newValues);
    }
  };

  return (
    <ComboboxField
      name={`filter-${title}`}
      options={comboboxOptions}
      placeholder={`Filter ${title}...`}
      searchPlaceholder={`Search ${title}...`}
      emptyMessage={`No ${title?.toLowerCase()} found.`}
      value={selectedValues}
      onChange={handleChange}
      showSelectAll
      showDeselectAll
      className={className}
    />
  );
}
