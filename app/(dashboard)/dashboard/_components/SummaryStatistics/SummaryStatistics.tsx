'use client';

import Image from 'next/image';
import Link from 'next/link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { api } from '~/trpc/client';
import { InterviewIcon, ProtocolIcon } from './Icons';
import StatCard, { StatCardSkeleton } from './StatCard';

export default function SummaryStatistics() {
  const { data: protocolCount, isLoading: isProtocolStatsLoading } =
    api.dashboard.getSummaryStatistics.protocolCount.useQuery();

  const { data: participantCount, isLoading: isParticipantStatsLoading } =
    api.dashboard.getSummaryStatistics.participantCount.useQuery();

  const { data: interviewCount, isLoading: isInterviewStatsLoading } =
    api.dashboard.getSummaryStatistics.interviewCount.useQuery();

  return (
    <ResponsiveContainer
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
      maxWidth="6xl"
    >
      <Link href="/dashboard/protocols">
        {isProtocolStatsLoading ? (
          <StatCardSkeleton title="Protocols" icon={<ProtocolIcon />} />
        ) : (
          <StatCard
            title="Protocols"
            initialData={protocolCount!}
            icon={<ProtocolIcon />}
          />
        )}
      </Link>
      <Link href="/dashboard/participants">
        {isParticipantStatsLoading ? (
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
        ) : (
          <StatCard
            title="Participants"
            initialData={participantCount!}
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
        )}
      </Link>
      <Link href="/dashboard/interviews">
        {isInterviewStatsLoading ? (
          <StatCardSkeleton title="Interviews" icon={<InterviewIcon />} />
        ) : (
          <StatCard
            title="Interviews"
            initialData={interviewCount!}
            icon={<InterviewIcon />}
          />
        )}
      </Link>
    </ResponsiveContainer>
  );
}
