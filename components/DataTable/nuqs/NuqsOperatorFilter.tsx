'use client';

import OperatorFilter from '@codaco/fresco-ui/DataTable/filters/OperatorFilter';
import { type Option } from '@codaco/fresco-ui/DataTable/types';
import { parseAsJson, useQueryState } from 'nuqs';
import { z } from 'zod/mini';
import { nuqsTableUrlKey, useNuqsTable } from './NuqsTableProvider';

// Mirrors fresco-ui's OperatorCondition. entityLabel is carried in the URL so
// the condition chips render without re-deriving labels; the server-side parser
// only needs entityKind/entityType/operator/value and ignores the rest.
const conditionsSchema = z.array(
  z.object({
    entityKind: z.enum(['nodes', 'edges']),
    entityType: z.string(),
    entityLabel: z.string(),
    operator: z.enum(['eq', 'gt', 'lt', 'gte', 'lte']),
    value: z.number(),
  }),
);

type NuqsOperatorFilterProps = {
  paramKey: string;
  /** Entity options with value `${kind}.${type}` (e.g. "nodes.person"). */
  entityOptions: Option[];
};

export default function NuqsOperatorFilter({
  paramKey,
  entityOptions,
}: NuqsOperatorFilterProps) {
  const { prefix, startTransition } = useNuqsTable();
  const urlKey = nuqsTableUrlKey(prefix, paramKey);
  const [conditions, setConditions] = useQueryState(
    urlKey,
    parseAsJson((v) => conditionsSchema.parse(v)).withOptions({
      shallow: false,
      clearOnDefault: true,
      startTransition,
    }),
  );

  return (
    <OperatorFilter
      value={conditions ? { conditions } : undefined}
      data={[]}
      config={{
        type: 'operator',
        operators: ['eq', 'gt', 'lt', 'gte', 'lte'],
        entitySelector: {
          label: 'Entity Type',
          getOptions: () => entityOptions,
        },
      }}
      onChange={(v) =>
        void setConditions(v && v.conditions.length > 0 ? v.conditions : null)
      }
    />
  );
}
