import { ParticipantsTable } from '~/app/(dashboard)/dashboard/_components/ParticipantsTable/ParticipantsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import PageHeader from '~/components/ui/typography/PageHeader';
import { api } from '~/trpc/server';

const ParticipantPage = async () => {
  let participants;
  try {
    participants = await api.participant.get.all.query();
  } catch (error) {
    throw new Error(error as string);
  }

  return (
    <ResponsiveContainer>
      <PageHeader
        headerText="Participants"
        subHeaderText="View and manage your participants."
      />
      <ParticipantsTable initialData={participants} />
    </ResponsiveContainer>
  );
};

export default ParticipantPage;
