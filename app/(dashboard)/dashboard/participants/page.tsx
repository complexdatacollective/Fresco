import { ParticipantsTable } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ParticipantsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import { api } from '~/trpc/server';
import { ExportParticipantUrlSection } from './_components/ExportParticipants/ExportParticipantUrlSection';

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
      <ResponsiveContainer>
        <ExportParticipantUrlSection />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl">
        <Section>
          <ParticipantsTable initialData={participants} />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default ParticipantPage;
