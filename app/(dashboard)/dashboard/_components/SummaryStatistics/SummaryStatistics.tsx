import Link from 'next/link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import StatCard, { StatCardSkeleton } from './StatCard';
import Image from 'next/image';
import { InterviewIcon, ProtocolIcon } from './Icons';
import { Suspense } from 'react';
import { unstable_noStore } from 'next/cache';
import { prisma } from '~/utils/db';

async function getInterviewCount() {
  unstable_noStore();

  // eslint-disable-next-line local-rules/require-data-mapper
  return await prisma.interview.count();
}

async function getParticipantCount() {
  unstable_noStore();

  // eslint-disable-next-line local-rules/require-data-mapper
  return await prisma.participant.count();
}

async function getProtocolCount() {
  unstable_noStore();

  // eslint-disable-next-line local-rules/require-data-mapper
  return await prisma.protocol.count();
}

export default function SummaryStatistics() {
  const interviewCount = getInterviewCount();
  const participantCount = getParticipantCount();
  const protocolCount = getProtocolCount();

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
