import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import { SettingsCardSkeleton } from '~/components/settings/SettingsCard';
import PageHeader from '~/components/typography/PageHeader';

export default function Loading() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Participants"
          subHeaderText="View and manage your participants."
        />
      </ResponsiveContainer>
      <ResponsiveContainer>
        <SettingsCardSkeleton hasControlArea />
      </ResponsiveContainer>

      <ResponsiveContainer maxWidth="6xl">
        <DataTableSkeleton columnCount={4} filterableColumnCount={3} />
      </ResponsiveContainer>
    </>
  );
}
