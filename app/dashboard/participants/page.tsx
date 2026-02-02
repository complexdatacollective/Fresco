import ParticipantsTable from '~/app/dashboard/_components/ParticipantsTable/ParticipantsTable';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import PageHeader from '~/components/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import ImportExportSection from './_components/ExportParticipants/ImportExportSection';

export default async function ParticipantPage() {
  await requireAppNotExpired();
  await requirePageAuth();

  return (
    <>
      <PageHeader
        headerText="Participants"
        subHeaderText="View and manage your participants."
        data-testid="participants-page-header"
      />
      <ImportExportSection />
      <ResponsiveContainer maxWidth="6xl" baseSize="content" container={false}>
        <ParticipantsTable />
      </ResponsiveContainer>
    </>
  );
}
