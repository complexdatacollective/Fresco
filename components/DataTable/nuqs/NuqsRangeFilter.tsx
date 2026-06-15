'use client';

import RangeFilter from '@codaco/fresco-ui/DataTable/filters/RangeFilter';
import { parseAsString, useQueryState } from 'nuqs';
import { type ComponentProps } from 'react';
import { nuqsTableUrlKey, useNuqsTable } from './NuqsTableProvider';

type NuqsRangeFilterProps = {
  paramKey: string;
  config: ComponentProps<typeof RangeFilter>['config'];
};

export default function NuqsRangeFilter({
  paramKey,
  config,
}: NuqsRangeFilterProps) {
  const { prefix, startTransition } = useNuqsTable();
  const urlKey = nuqsTableUrlKey(prefix, paramKey);
  const [raw, setRaw] = useQueryState(
    urlKey,
    parseAsString.withOptions({
      shallow: false,
      clearOnDefault: true,
      startTransition,
    }),
  );

  // URL encodes a numeric range as "min..max"; RangeFilter expects { min, max }.
  const parts = raw ? raw.split('..') : [];
  const min = parts[0] !== undefined ? Number(parts[0]) : NaN;
  const max = parts[1] !== undefined ? Number(parts[1]) : NaN;
  const value = !isNaN(min) && !isNaN(max) ? { min, max } : undefined;

  return (
    <RangeFilter
      value={value}
      config={config}
      onChange={(v) => void setRaw(v ? `${v.min}..${v.max}` : null)}
    />
  );
}
