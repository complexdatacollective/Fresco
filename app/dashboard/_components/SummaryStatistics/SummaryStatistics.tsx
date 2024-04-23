import Image from 'next/image';
import Link from 'next/link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { InterviewIcon, ProtocolIcon } from './Icons';
import StatCard, { StatCardSkeleton } from './StatCard';
import { Suspense } from 'react';
import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';

const getSummaryStatistics = async () => {
  unstable_noStore();

  const counts = await prisma.$transaction([
    prisma.interview.count(),
    prisma.protocol.count(),
    prisma.participant.count(),
  ]);

  return {
    interviewCount: counts[0],
    protocolCount: counts[1],
    participantCount: counts[2],
  };
};

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
