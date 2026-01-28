import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import PageHeader from '~/components/typography/PageHeader';

export default function Loading() {
  return (
    <>
      <PageHeader
        headerText="Interviews"
        subHeaderText="View and manage your interview data."
      />
      <ResponsiveContainer maxWidth="full" baseSize="content" container={false}>
        <DataTableSkeleton
          columnCount={6}
          searchableColumnCount={1}
          headerItemsCount={2}
        />
      </ResponsiveContainer>
    </>
  );
}
