import ResponsiveContainer from '~/components/ResponsiveContainer';
import Heading from '~/components/ui/typography/Heading';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import {
  ActivityFeed,
  type IndexPageProps,
} from './_components/ActivityFeed/ActivityFeed';
import Paragraph from '~/components/ui/typography/Paragraph';
import { Divider } from '~/components/ui/Divider';
import SummaryStatistics from './_components/SummaryStatistics/SummaryStatistics';

function Home({ searchParams }: IndexPageProps) {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Dashboard testing the changes in Deployment."
          subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
        />
      </ResponsiveContainer>
      <Divider />
      <SummaryStatistics />
      <Divider />
      <ResponsiveContainer>
        <Heading variant="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl">
        <Section>
          <ActivityFeed searchParams={searchParams} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}

export default Home;
