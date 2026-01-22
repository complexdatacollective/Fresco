import { Suspense } from 'react';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Heading from '~/components/typography/Heading';
import PageHeader from '~/components/typography/PageHeader';
import Paragraph from '~/components/typography/Paragraph';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import ActivityFeed from './_components/ActivityFeed/ActivityFeed';
import { searchParamsCache } from './_components/ActivityFeed/SearchParams';
import SummaryStatistics from './_components/SummaryStatistics/SummaryStatistics';
import UpdateUploadThingTokenAlert from './_components/UpdateUploadThingTokenAlert';
import AnonymousRecruitmentWarning from './protocols/_components/AnonymousRecruitmentWarning';

export default async function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAppNotExpired();
  await requirePageAuth();

  searchParamsCache.parse(searchParams);

  return (
    <>
      <ResponsiveContainer maxWidth="3xl">
        <Suspense fallback={null}>
          <AnonymousRecruitmentWarning />
        </Suspense>
      </ResponsiveContainer>
      <PageHeader
        headerText="Dashboard"
        subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
      />

      <Suspense fallback={null}>
        <UpdateUploadThingTokenAlert />
      </Suspense>

      <SummaryStatistics />

      <ResponsiveContainer maxWidth="3xl">
        <Heading level="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="4xl" baseSize="100%" container={false}>
        <ActivityFeed />
      </ResponsiveContainer>
    </>
  );
}
