import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import ResponsiveContainer from '~/components/layout/ResponsiveContainer';
import { type getSummaryStatistics } from '~/queries/summaryStatistics';
import { InterviewIcon, ProtocolIcon } from './Icons';
import StatCard, { StatCardSkeleton } from './StatCard';

type SummaryStatisticsProps = {
  dataPromise: ReturnType<typeof getSummaryStatistics>;
};

export default function SummaryStatistics({
  dataPromise,
}: SummaryStatisticsProps) {
  return (
    <ResponsiveContainer
      className="tablet:grid-cols-3 desktop:gap-6 grid grid-cols-1 gap-4"
      maxWidth="6xl"
    >
      <Link
        className="focusable @container rounded"
        href="/dashboard/protocols"
        data-testid="stat-card-protocols"
      >
        <Suspense
          fallback={
            <StatCardSkeleton title="Protocols" icon={<ProtocolIcon />} />
          }
        >
          <StatCard
            title="Protocols"
            dataPromise={dataPromise}
            render="protocolCount"
            icon={<ProtocolIcon />}
          />
        </Suspense>
      </Link>
      <Link
        className="focusable @container rounded"
        href="/dashboard/participants"
        data-testid="stat-card-participants"
      >
        <Suspense
          fallback={
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
          }
        >
          <StatCard
            title="Participants"
            dataPromise={dataPromise}
            render="participantCount"
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
        </Suspense>
      </Link>
      <Link
        className="focusable @container rounded"
        href="/dashboard/interviews"
        data-testid="stat-card-interviews"
      >
        <Suspense
          fallback={
            <StatCardSkeleton title="Interviews" icon={<InterviewIcon />} />
          }
        >
          <StatCard
            title="Interviews"
            dataPromise={dataPromise}
            render="interviewCount"
            icon={<InterviewIcon />}
          />
        </Suspense>
      </Link>
    </ResponsiveContainer>
  );
}
