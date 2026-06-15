'use client';

import DateFilter from '@codaco/fresco-ui/DataTable/filters/DateFilter';
import { parseAsString, useQueryState } from 'nuqs';
import { nuqsTableUrlKey, useNuqsTable } from './NuqsTableProvider';

type NuqsDateFilterProps = {
  paramKey: string;
};

export default function NuqsDateFilter({ paramKey }: NuqsDateFilterProps) {
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

  // URL encodes a date range as "fromISO..toISO"; DateFilter expects { from, to }.
  const parts = raw ? raw.split('..') : [];
  const from = parts[0];
  const to = parts[1];
  const value = from && to ? { from, to } : undefined;

  return (
    <DateFilter
      value={value}
      config={{ type: 'date' }}
      onChange={(v) => void setRaw(v ? `${v.from}..${v.to}` : null)}
    />
  );
}
