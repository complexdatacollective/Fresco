import ResponsiveContainer from '~/components/ResponsiveContainer';
import PageHeader from '~/components/ui/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';

export default async function ParticipantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      {children}
    </>
  );
}
