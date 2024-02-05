import { InterviewsTable } from '~/app/(dashboard)/dashboard/_components/InterviewsTable/InterviewsTable';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';

const InterviewPage = () => {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Interviews"
          subHeaderText="View and manage your interviews."
        />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl">
        <Section>
          <InterviewsTable />
        </Section>
      </ResponsiveContainer>
    </>
  );
};

export default InterviewPage;
