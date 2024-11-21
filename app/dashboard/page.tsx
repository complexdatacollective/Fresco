import { Suspense } from 'react';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import Heading from '~/components/ui/typography/Heading';
import PageHeader from '~/components/ui/typography/PageHeader';
import Paragraph from '~/components/ui/typography/Paragraph';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import ActivityFeed from './_components/ActivityFeed/ActivityFeed';
import { searchParamsCache } from './_components/ActivityFeed/SearchParams';
import SummaryStatistics from './_components/SummaryStatistics/SummaryStatistics';
import UpdateUploadThingTokenAlert from './_components/UpdateUploadThingTokenAlert';
import AnonymousRecruitmentWarning from './protocols/_components/AnonymousRecruitmentWarning';

export default async function Home(
  props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  await requireAppNotExpired();
  await requirePageAuth();

  searchParamsCache.parse(searchParams);

  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Dashboard"
          subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
        />
        <Suspense fallback={null}>
          <AnonymousRecruitmentWarning />
        </Suspense>
        <Suspense fallback={null}>
          <UpdateUploadThingTokenAlert />
        </Suspense>
      </ResponsiveContainer>
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
