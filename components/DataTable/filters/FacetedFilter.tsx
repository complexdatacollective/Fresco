'use client';

import { useMemo } from 'react';
import { type FacetedFilterConfig } from '~/components/DataTable/filters/types';
import ComboboxField from '~/lib/form/components/fields/Combobox/Combobox';
import { type ComboboxOption } from '~/lib/form/components/fields/Combobox/shared';

type FacetedFilterProps = {
  value: string[] | undefined;
  onChange: (value: string[] | undefined) => void;
  config: FacetedFilterConfig;
  data: unknown[];
};

export default function FacetedFilter({
  value,
  onChange,
  config,
  data,
}: FacetedFilterProps) {
  const resolvedOptions =
    typeof config.options === 'function'
      ? config.options(data)
      : config.options;

  const comboboxOptions: ComboboxOption[] = useMemo(
    () =>
      resolvedOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    [resolvedOptions],
  );

  const handleChange = (newValues: (string | number)[] | undefined) => {
    if (!newValues || newValues.length === 0) {
      onChange(undefined);
    } else {
      onChange(newValues.map(String));
    }
  };

  return (
    <ComboboxField
      size="sm"
      name="faceted-filter"
      options={comboboxOptions}
      placeholder="Select..."
      searchPlaceholder="Search..."
      emptyMessage="No options found."
      value={value ?? []}
      onChange={handleChange}
      showSelectAll
      showDeselectAll
    />
  );
}
