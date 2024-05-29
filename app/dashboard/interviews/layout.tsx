import ResponsiveContainer from '~/components/ResponsiveContainer';
import PageHeader from '~/components/ui/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';

export default async function InterviewsLayout({
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
          headerText="Interviews"
          subHeaderText="View and manage your interview data."
        />
      </ResponsiveContainer>
      {children}
    </>
  );
}
