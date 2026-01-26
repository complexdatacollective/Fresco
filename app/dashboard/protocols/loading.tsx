import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import PageHeader from '~/components/typography/PageHeader';

export default function Loading() {
  return (
    <>
      <PageHeader
        headerText="Protocols"
        subHeaderText="Upload and manage your interview protocols."
      />
      <ResponsiveContainer maxWidth="6xl" baseSize="content" container={false}>
        <DataTableSkeleton
          columnCount={4}
          searchableColumnCount={1}
          headerItemsCount={1}
        />
      </ResponsiveContainer>
    </>
  );
}
