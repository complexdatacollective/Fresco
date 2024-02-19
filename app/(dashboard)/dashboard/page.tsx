import ResponsiveContainer from '~/components/ResponsiveContainer';
import Heading from '~/components/ui/typography/Heading';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import { ActivityFeed } from './_components/ActivityFeed/ActivityFeed';
import Paragraph from '~/components/ui/typography/Paragraph';
import SummaryStatistics from './_components/SummaryStatistics/SummaryStatistics';
import AnonymousRecruitmentWarning from './protocols/_components/AnonymousRecruitmentWarning';

function Home() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Dashboard"
          subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
        />
      </ResponsiveContainer>
      <AnonymousRecruitmentWarning />
      <SummaryStatistics />
      <ResponsiveContainer>
        <Heading variant="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <ActivityFeed />
        </Section>
      </ResponsiveContainer>
    </>
  );
}

export default Home;
