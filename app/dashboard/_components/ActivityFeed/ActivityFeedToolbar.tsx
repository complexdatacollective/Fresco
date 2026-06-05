'use client';

import NuqsClearFilters from '~/components/DataTable/nuqs/NuqsClearFilters';
import NuqsFacetedFilter from '~/components/DataTable/nuqs/NuqsFacetedFilter';
import NuqsSearchFilter from '~/components/DataTable/nuqs/NuqsSearchFilter';
import ExportActivityFeed from './ExportActivityFeed';
import { activityTypes } from './types';

const clearableFilters = ['q', 'type'] as const;

export default function ActivityFeedToolbar() {
  return (
    <div className="tablet-landscape:flex-row tablet-landscape:flex-wrap flex w-full flex-col items-center justify-center gap-2">
      <NuqsSearchFilter
        paramKey="q"
        placeholder="Filter by activity details..."
        className="tablet-landscape:min-w-0 tablet-landscape:flex-1 tablet-landscape:max-w-xl w-full min-w-fit"
      />
      <NuqsFacetedFilter
        paramKey="type"
        values={activityTypes}
        placeholder="Filter Type..."
        searchPlaceholder="Search Type..."
        emptyMessage="No type found."
      />
      <ExportActivityFeed />
      <NuqsClearFilters paramKeys={clearableFilters} />
    </div>
  );
}
