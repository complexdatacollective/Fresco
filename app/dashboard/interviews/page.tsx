import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import InterviewsTable from '../_components/InterviewsTable/InterviewsTable';

export default function InterviewPage() {
  return (
    <>
      <ResponsiveContainer maxWidth="7xl">
        <Section>
          <InterviewsTable />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
