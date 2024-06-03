import ResponsiveContainer from '~/components/ResponsiveContainer';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import Section from '~/components/layout/Section';
import Heading from '~/components/ui/typography/Heading';
import PageHeader from '~/components/ui/typography/PageHeader';
import Paragraph from '~/components/ui/typography/Paragraph';
import { SummaryStatisticsSkeleton } from './_components/SummaryStatistics/SummaryStatistics';
import { AnonymousRecruitmentWarningSkeleton } from './protocols/_components/AnonymousRecruitmentWarning';

export default function Loading() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Dashboard"
          subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
        />
      </ResponsiveContainer>
      <AnonymousRecruitmentWarningSkeleton />
      <SummaryStatisticsSkeleton />
      <ResponsiveContainer>
        <Heading variant="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="6xl">
        <Section>
          <DataTableSkeleton columnCount={3} filterableColumnCount={1} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}
