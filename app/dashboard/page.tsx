import Image from 'next/image';
import { Suspense } from 'react';
import { DataTableSkeleton } from '~/components/data-table/data-table-skeleton';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import Heading from '~/components/typography/Heading';
import PageHeader from '~/components/typography/PageHeader';
import Paragraph from '~/components/typography/Paragraph';
import { Skeleton } from '~/components/ui/skeleton';
import { getActivities } from '~/queries/activityFeed';
import { requireAppNotExpired } from '~/queries/appSettings';
import { getSummaryStatistics } from '~/queries/summaryStatistics';
import { requirePageAuth } from '~/utils/auth';
import ActivityFeed from './_components/ActivityFeed/ActivityFeed';
import { searchParamsCache } from './_components/ActivityFeed/SearchParams';
import { StatCardSkeleton } from './_components/SummaryStatistics/StatCard';
import {
  InterviewIcon,
  ProtocolIcon,
} from './_components/SummaryStatistics/Icons';
import SummaryStatistics from './_components/SummaryStatistics/SummaryStatistics';
import UpdateUploadThingTokenAlert from './_components/UpdateUploadThingTokenAlert';
import AnonymousRecruitmentWarning from './protocols/_components/AnonymousRecruitmentWarning';

export default function Home(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <>
      <PageHeader
        headerText="Dashboard"
        subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
        data-testid="dashboard-page-header"
      />
      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

function DashboardContentSkeleton() {
  return (
    <>
      <ResponsiveContainer
        className="tablet:grid-cols-3 desktop:gap-6 grid grid-cols-1 gap-4"
        maxWidth="6xl"
      >
        <StatCardSkeleton title="Protocols" icon={<ProtocolIcon />} />
        <StatCardSkeleton
          title="Participants"
          icon={
            <Image
              src="/images/participant.svg"
              width={50}
              height={50}
              alt="Participant icon"
              className="max-w-none"
            />
          }
        />
        <StatCardSkeleton title="Interviews" icon={<InterviewIcon />} />
      </ResponsiveContainer>

      <ResponsiveContainer maxWidth="3xl">
        <Heading level="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="4xl" baseSize="100%" container={false}>
        <DataTableSkeleton columnCount={3} filterableColumnCount={1} />
      </ResponsiveContainer>
    </>
  );
}

async function DashboardContent({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await searchParamsPromise;
  searchParamsCache.parse(searchParams);

  const summaryPromise = getSummaryStatistics();
  const activitiesPromise = getActivities(searchParamsCache.all());

  await Promise.all([requireAppNotExpired(), requirePageAuth()]);

  return (
    <>
      <ResponsiveContainer maxWidth="3xl">
        <Suspense fallback={<Skeleton className="h-20 w-full rounded" />}>
          <AnonymousRecruitmentWarning />
        </Suspense>
      </ResponsiveContainer>

      <Suspense fallback={<Skeleton className="h-20 w-full rounded" />}>
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
