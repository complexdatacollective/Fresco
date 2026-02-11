import { Suspense } from 'react';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Heading from '~/components/typography/Heading';
import PageHeader from '~/components/typography/PageHeader';
import Paragraph from '~/components/typography/Paragraph';
import { getActivities } from '~/queries/activityFeed';
import { requireAppNotExpired } from '~/queries/appSettings';
import { getSummaryStatistics } from '~/queries/summaryStatistics';
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
  // Parse search params first (synchronous)
  searchParamsCache.parse(searchParams);

  // Pre-warm data fetches - start them immediately so they run in parallel with auth
  const summaryPromise = getSummaryStatistics();
  const activitiesPromise = getActivities(searchParamsCache.all());

  // Run auth checks in parallel (both can redirect independently)
  await Promise.all([requireAppNotExpired(), requirePageAuth()]);

  return (
    <>
      <PageHeader
        headerText="Dashboard"
        subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
        data-testid="dashboard-page-header"
      />
      <ResponsiveContainer maxWidth="3xl">
        <Suspense fallback={null}>
          <AnonymousRecruitmentWarning />
        </Suspense>
      </ResponsiveContainer>

      <Suspense fallback={null}>
        <UpdateUploadThingTokenAlert />
      </Suspense>

      <SummaryStatistics dataPromise={summaryPromise} />

      <ResponsiveContainer maxWidth="3xl">
        <Heading level="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="4xl" baseSize="100%" container={false}>
        <ActivityFeed activitiesPromise={activitiesPromise} />
      </ResponsiveContainer>
    </>
  );
}
