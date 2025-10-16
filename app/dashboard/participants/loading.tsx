import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Section from '~/components/layout/Section';
import { SettingsSectionSkeleton } from '~/components/layout/SettingsSection';
import PageHeader from '~/components/typography/PageHeader';
import { ButtonSkeleton } from '~/components/ui/Button';

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
        <SettingsSectionSkeleton
          controlAreaSkelton={
            <div className="flex w-72 flex-col items-center justify-end gap-4">
              <ButtonSkeleton className="w-full" />
              <ButtonSkeleton className="w-full" />
            </div>
          }
        />
      </ResponsiveContainer>

      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <DataTableSkeleton columnCount={4} filterableColumnCount={3} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
