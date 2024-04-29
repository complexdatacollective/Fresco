import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import InterviewsTableServer from '../_components/InterviewsTable/InterviewsTableServer';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';

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
      <ResponsiveContainer maxWidth="7xl">
        <Section>
          <InterviewsTableServer />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
