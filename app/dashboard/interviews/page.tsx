import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/typography/PageHeader';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import InterviewsTableServer from '../_components/InterviewsTable/InterviewsTableServer';

export default async function InterviewPage() {
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
      <ResponsiveContainer maxWidth="8xl" baseSize="content">
        <Section>
          <InterviewsTableServer />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
