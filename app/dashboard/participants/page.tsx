import ParticipantsTable from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import ImportExportSection from './_components/ExportParticipants/ImportExportSection';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import { Suspense } from 'react';

export default async function ParticipantPage() {
  await requireAppNotExpired();
  await requirePageAuth();
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Participants"
          subHeaderText="View and manage your participants."
        />
      </ResponsiveContainer>
      <Suspense fallback="Loading...">
        <ImportExportSection />
      </Suspense>
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <ParticipantsTable />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
