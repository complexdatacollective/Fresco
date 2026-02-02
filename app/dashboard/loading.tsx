import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Heading from '~/components/typography/Heading';
import PageHeader from '~/components/typography/PageHeader';
import Paragraph from '~/components/typography/Paragraph';

export default function Loading() {
  return (
    <>
      <PageHeader
        headerText="Dashboard"
        subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
      />

      <ResponsiveContainer maxWidth="3xl">
        <Heading level="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
    </>
  );
}
