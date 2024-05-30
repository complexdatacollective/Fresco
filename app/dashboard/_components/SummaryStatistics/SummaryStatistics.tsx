import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { getSummaryStatistics } from '~/queries/summaryStatistics';
import { InterviewIcon, ProtocolIcon } from './Icons';
import StatCard, { StatCardSkeleton } from './StatCard';

export default function SummaryStatistics() {
  const data = getSummaryStatistics();

  return (
    <ResponsiveContainer
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
      maxWidth="6xl"
    >
      <Link href="/dashboard/protocols">
        <Suspense
          fallback={
            <StatCardSkeleton title="Protocols" icon={<ProtocolIcon />} />
          }
        >
          <StatCard
            title="Protocols"
            dataPromise={data}
            render="protocolCount"
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
            dataPromise={data}
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
      <Link href="/dashboard/interviews">
        <Suspense
          fallback={
            <StatCardSkeleton title="Interviews" icon={<InterviewIcon />} />
          }
        >
          <StatCard
            title="Interviews"
            dataPromise={data}
            render="interviewCount"
            icon={<InterviewIcon />}
          />
        </Suspense>
      </Link>
    </ResponsiveContainer>
  );
}

export const SummaryStatisticsSkeleton = () => (
  <ResponsiveContainer
    className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
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
);
