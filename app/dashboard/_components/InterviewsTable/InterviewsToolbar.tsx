'use client';

import { type ReactNode } from 'react';
import NuqsBooleanFilter from '~/components/DataTable/nuqs/NuqsBooleanFilter';
import NuqsClearFilters from '~/components/DataTable/nuqs/NuqsClearFilters';
import NuqsDateFilter from '~/components/DataTable/nuqs/NuqsDateFilter';
import NuqsFacetedFilter from '~/components/DataTable/nuqs/NuqsFacetedFilter';
import NuqsOperatorFilter from '~/components/DataTable/nuqs/NuqsOperatorFilter';
import NuqsRangeFilter from '~/components/DataTable/nuqs/NuqsRangeFilter';
import NuqsSearchFilter from '~/components/DataTable/nuqs/NuqsSearchFilter';
import type { InterviewFilterOptions } from '~/queries/interviews';

const PROGRESS_CONFIG = {
  type: 'range' as const,
  min: 0,
  max: 100,
  step: 1,
  presets: [
    { label: 'Not Started', min: 0, max: 0 },
    { label: 'In Progress', min: 1, max: 99 },
    { label: 'Complete', min: 100, max: 100 },
  ],
  formatLabel: (v: number) => `${String(v)}%`,
};

const clearableFilters = [
  'q',
  'protocol',
  'started',
  'updated',
  'progress',
  'exported',
  'network',
] as const;

export default function InterviewsToolbar({
  filterOptions,
  children,
}: {
  filterOptions: InterviewFilterOptions;
  children: ReactNode;
}) {
  const entityOptions = [
    ...filterOptions.nodeTypes.map((t) => ({
      value: `nodes.${t.value}`,
      label: `${t.label} (nodes)`,
    })),
    ...filterOptions.edgeTypes.map((t) => ({
      value: `edges.${t.value}`,
      label: `${t.label} (edges)`,
    })),
  ];

  return (
    <div className="tablet-landscape:flex-row tablet-landscape:flex-wrap flex w-full flex-col items-center gap-2">
      <NuqsSearchFilter paramKey="q" placeholder="Filter by identifier..." />
      <NuqsFacetedFilter
        paramKey="protocol"
        values={filterOptions.protocolNames}
        getLabel={(v) => v.replace(/\.netcanvas$/, '')}
        placeholder="Protocol..."
      />
      <NuqsDateFilter paramKey="started" />
      <NuqsDateFilter paramKey="updated" />
      <NuqsRangeFilter paramKey="progress" config={PROGRESS_CONFIG} />
      <NuqsOperatorFilter paramKey="network" entityOptions={entityOptions} />
      <NuqsBooleanFilter
        paramKey="exported"
        config={{
          type: 'boolean',
          trueLabel: 'Exported',
          falseLabel: 'Not Exported',
        }}
      />
      {children}
      <NuqsClearFilters paramKeys={clearableFilters} />
    </div>
  );
}
