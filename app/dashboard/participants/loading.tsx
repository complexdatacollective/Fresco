'use client';

import ResponsiveContainer from '~/components/ResponsiveContainer';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import Section from '~/components/layout/Section';
import SettingsSection from '~/components/layout/SettingsSection';
import { ButtonSkeleton } from '~/components/ui/Button';
import Paragraph from '~/components/ui/typography/Paragraph';

// Loading state for the Participants table and import/export section
export default function Loading() {
  return (
    <>
      <ResponsiveContainer>
        <SettingsSection
          heading="Import/Export Participants in Bulk"
          controlArea={
            <div className="flex w-72 flex-col items-center justify-end gap-4">
              <ButtonSkeleton className="w-full" />
              <ButtonSkeleton className="w-full" />
            </div>
          }
        >
          <Paragraph>
            Import or export participants in bulk using the options to the
            right. Refer to our documentation for information about the formats
            used.
          </Paragraph>
        </SettingsSection>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <DataTableSkeleton columnCount={5} filterableColumnCount={3} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
