import Link from 'next/link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import StatCard from './StatCard';
import Image from 'next/image';
import { InterviewIcon, ProtocolIcon } from './Icons';
import { api } from '~/trpc/server';

export default async function SummaryStatistics() {
  const summaryStatistics = await api.dashboard.getSummaryStatistics.query();
  return (
    <ResponsiveContainer
      className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
      maxWidth="5xl"
    >
      <Link href="/dashboard/protocols">
        <StatCard
          title="Protocols"
          value={summaryStatistics.protocolCount}
          icon={<ProtocolIcon />}
        />
      </Link>
      <Link href="/dashboard/participants">
        <StatCard
          title="Participants"
          value={summaryStatistics.participantCount}
          icon={
            <Image
              src="/images/participant.svg"
              width={40}
              height={40}
              alt="Participant icon"
            />
          }
        />
      </Link>
      <Link href="/dashboard/interviews">
        <StatCard
          title="Interviews"
          value={summaryStatistics.interviewCount}
          icon={<InterviewIcon />}
        />
      </Link>
    </ResponsiveContainer>
  );
}
