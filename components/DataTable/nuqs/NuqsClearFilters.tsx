'use client';

import { X } from 'lucide-react';
import { parseAsString, useQueryStates } from 'nuqs';
import { useMemo } from 'react';
import { Button } from '~/components/ui/Button';
import { nuqsTableUrlKey, useNuqsTable } from './NuqsTableProvider';

type NuqsClearFiltersProps = {
  /**
   * Logical param names (unprefixed) to clear. The provider's `prefix` will
   * be applied to derive the URL keys.
   */
  paramKeys: readonly string[];
  label?: string;
};

/**
 * URL-backed "clear all filters" button for server-fetched tables.
 *
 * Hidden when none of the tracked params are set. Uses a string parser for
 * all keys because the only thing we need to know is presence — the actual
 * parsing for each key lives in its dedicated filter component.
 */
export default function NuqsClearFilters({
  paramKeys,
  label = 'Clear Filters',
}: NuqsClearFiltersProps) {
  const { prefix, startTransition } = useNuqsTable();

  const parsers = useMemo(() => {
    const entries = paramKeys.map(
      (key) => [key, parseAsString.withOptions({ clearOnDefault: true })] as const,
    );
    return Object.fromEntries(entries) as Record<
      (typeof paramKeys)[number],
      typeof parseAsString
    >;
  }, [paramKeys]);

  const urlKeys = useMemo(() => {
    const entries = paramKeys.map(
      (key) => [key, nuqsTableUrlKey(prefix, key)] as const,
    );
    return Object.fromEntries(entries) as Record<
      (typeof paramKeys)[number],
      string
    >;
  }, [paramKeys, prefix]);

  const [values, setValues] = useQueryStates(parsers, {
    urlKeys,
    shallow: false,
    startTransition,
  });

  const hasAnyFilter = Object.values(values).some(
    (v) => v !== null && v !== '',
  );
  if (!hasAnyFilter) return null;

  const cleared = Object.fromEntries(paramKeys.map((k) => [k, null])) as Record<
    (typeof paramKeys)[number],
    null
  >;

  return (
    <Button
      variant="text"
      icon={<X className="size-4" aria-hidden="true" />}
      onClick={() => {
        void setValues(cleared);
      }}
    >
      {label}
    </Button>
  );
}
