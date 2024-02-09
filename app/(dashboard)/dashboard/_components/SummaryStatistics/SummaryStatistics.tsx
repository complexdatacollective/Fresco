import Link from 'next/link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import StatCard from './StatCard';
import Image from 'next/image';
import { InterviewIcon, ProtocolIcon } from './Icons';
import { api } from '~/trpc/server';
import { unstable_noStore } from 'next/cache';

export default async function SummaryStatistics() {
  unstable_noStore();

  const interviewCount =
    await api.dashboard.getSummaryStatistics.interviewCount.query();
  const participantCount =
    await api.dashboard.getSummaryStatistics.participantCount.query();
  const protocolCount =
    await api.dashboard.getSummaryStatistics.protocolCount.query();

  return (
    <ResponsiveContainer
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
      maxWidth="5xl"
    >
      <Link href="/dashboard/protocols">
        <StatCard
          title="Protocols"
          initialData={protocolCount}
          icon={<ProtocolIcon />}
        />
      </Link>
      <Link href="/dashboard/participants">
        <StatCard
          title="Participants"
          initialData={participantCount}
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
      </Link>
      <Link href="/dashboard/interviews">
        <StatCard
          title="Interviews"
          initialData={interviewCount}
          icon={<InterviewIcon />}
        />
      </Link>
    </ResponsiveContainer>
  );
}
