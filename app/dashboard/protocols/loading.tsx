'use client';

import { getProtocolColumns } from '~/app/dashboard/_components/ProtocolsTable/Columns';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import Section from '~/components/layout/Section';

// Loading state for the Protocols table
export default function Loading() {
  return (
    <ResponsiveContainer maxWidth="6xl">
      <Section>
        <DataTableSkeleton columnCount={getProtocolColumns().length} />
      </Section>
    </ResponsiveContainer>
  );
}
