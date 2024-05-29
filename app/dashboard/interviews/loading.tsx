'use client';

import ResponsiveContainer from '~/components/ResponsiveContainer';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import Section from '~/components/layout/Section';

// Loading state for the Protocols table
export default function Loading() {
  return (
    <ResponsiveContainer maxWidth="6xl">
      <Section>
        <DataTableSkeleton columnCount={5} filterableColumnCount={3} />
      </Section>
    </ResponsiveContainer>
  );
}
