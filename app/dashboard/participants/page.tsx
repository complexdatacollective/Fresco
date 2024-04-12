import { ParticipantsTable } from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import { api } from '~/trpc/server';
import ImportExportSection from './_components/ExportParticipants/ImportExportSection';

export const dynamic = 'force-dynamic';

const ParticipantPage = async () => {
  const participants = await api.participant.get.all.query();

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
          <ParticipantsTable initialData={participants} />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default ParticipantPage;
