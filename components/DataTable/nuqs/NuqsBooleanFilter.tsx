'use client';

import BooleanFilter from '@codaco/fresco-ui/DataTable/filters/BooleanFilter';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { type ComponentProps } from 'react';
import { nuqsTableUrlKey, useNuqsTable } from './NuqsTableProvider';

type NuqsBooleanFilterProps = {
  paramKey: string;
  config: ComponentProps<typeof BooleanFilter>['config'];
};

export default function NuqsBooleanFilter({
  paramKey,
  config,
}: NuqsBooleanFilterProps) {
  const { prefix, startTransition } = useNuqsTable();
  const urlKey = nuqsTableUrlKey(prefix, paramKey);
  const [value, setValue] = useQueryState(
    urlKey,
    parseAsBoolean.withOptions({
      shallow: false,
      clearOnDefault: true,
      startTransition,
    }),
  );

  return (
    <BooleanFilter
      value={value ?? undefined}
      config={config}
      onChange={(v) => void setValue(v ?? null)}
    />
  );
}
