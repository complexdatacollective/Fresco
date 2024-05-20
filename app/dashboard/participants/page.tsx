import ParticipantsTable from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import ImportExportSection from './_components/ExportParticipants/ImportExportSection';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';

export default async function ParticipantPage() {
  await requireAppNotExpired();
  await requirePageAuth({ redirectPath: '/dashboard/participants' });
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Participants"
          subHeaderText="View and manage your participants."
        />
      </ResponsiveContainer>
      <ImportExportSection />
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <ParticipantsTable />
        </Section>
      </ResponsiveContainer>
    </>
  );
}