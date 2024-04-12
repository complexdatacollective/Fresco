import { InterviewsTable } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/InterviewsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import { api } from '~/trpc/server';

export const dynamic = 'force-dynamic';

const InterviewPage = async () => {
  const initialInterviews = await api.interview.get.all.query();
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
          <InterviewsTable initialInterviews={initialInterviews} />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default InterviewPage;
