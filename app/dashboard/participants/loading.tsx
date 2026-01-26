import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import SettingsCard from '~/components/settings/SettingsCard';
import Paragraph from '~/components/typography/Paragraph';
import PageHeader from '~/components/typography/PageHeader';
import { ButtonSkeleton } from '~/components/ui/Button';

export default function Loading() {
  return (
    <>
      <PageHeader
        headerText="Participants"
        subHeaderText="View and manage your participants."
      />
      <SettingsCard
        title="Import/Export Participants in Bulk"
        controlArea={
          <div className="flex w-72 flex-col items-center justify-end gap-4">
            <ButtonSkeleton className="w-full" />
            <ButtonSkeleton className="w-full" />
          </div>
        }
        className="mx-auto"
      >
        <Paragraph>
          Import or export participants in bulk using the options to the right.
          Refer to our documentation for information about the formats used.
        </Paragraph>
      </SettingsCard>
      <ResponsiveContainer maxWidth="6xl" baseSize="content" container={false}>
        <DataTableSkeleton
          columnCount={4}
          searchableColumnCount={1}
          headerItemsCount={3}
        />
      </ResponsiveContainer>
    </>
  );
}
