import Link from 'next/link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import StatCard, { StatCardSkeleton } from './StatCard';
import Image from 'next/image';
import { InterviewIcon, ProtocolIcon } from './Icons';
import { Suspense } from 'react';
import { api } from '~/trpc/server';

export default function SummaryStatistics() {
  const interviewCount =
    api.dashboard.getSummaryStatistics.interviewCount.query();
  const participantCount =
    api.dashboard.getSummaryStatistics.participantCount.query();
  const protocolCount =
    api.dashboard.getSummaryStatistics.protocolCount.query();

  return (
    <ResponsiveContainer
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
      maxWidth="5xl"
    >
      <Link href="/dashboard/protocols">
        <Suspense
          fallback={
            <StatCardSkeleton title="Protocols" icon={<ProtocolIcon />} />
          }
        >
          <StatCard
            title="Protocols"
            valuePromise={protocolCount}
            icon={<ProtocolIcon />}
          />
        </Suspense>
      </Link>
      <Link href="/dashboard/participants">
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
            valuePromise={participantCount}
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
      <Link href="/dashboard/interviews">
        <Suspense
          fallback={
            <StatCardSkeleton title="Interviews" icon={<InterviewIcon />} />
          }
        >
          <StatCard
            title="Interviews"
            valuePromise={interviewCount}
            icon={<InterviewIcon />}
          />
        </Suspense>
      </Link>
    </ResponsiveContainer>
  );
}
