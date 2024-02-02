import ResponsiveContainer from '~/components/ResponsiveContainer';
import Heading from '~/components/ui/typography/Heading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Calendar, Users } from 'lucide-react';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import {
  ActivityFeed,
  type IndexPageProps,
} from './_components/ActivityFeed/ActivityFeed';
import Link from 'next/link';
import Image from 'next/image';
import Paragraph from '~/components/ui/typography/Paragraph';
import { Divider } from '~/components/ui/Divider';

const ProtocolIcon = () => (
  <div className="flex aspect-[4/3] h-[40px] flex-col overflow-hidden rounded-[8px] bg-platinum">
    <div className="flex h-2/3 w-full flex-col justify-center gap-[3px] px-[6px]">
      <div className="h-[4.5px] w-10/12 rounded-full bg-platinum-dark" />
      <div className="h-[2.5px] w-3/12 rounded-full bg-platinum-dark" />
    </div>
    <div className="flex h-1/3 w-full items-center justify-end bg-slate-blue px-[6px]">
      <div className="h-[2.5px] w-5/12 rounded-full bg-slate-blue-dark" />
    </div>
  </div>
);

const InterviewIcon = () => (
  <div className="flex aspect-[4/3] h-[40px] flex-col overflow-hidden rounded-[8px] bg-platinum">
    <div className="flex h-2/4 w-full flex-col justify-center gap-[3px] px-[6px]">
      <div className="h-[4.5px] w-10/12 rounded-full bg-platinum-dark" />
      <div className="h-[2.5px] w-3/12 rounded-full bg-platinum-dark" />
    </div>
    <div className="flex h-2/4 w-full items-center gap-[3px] bg-platinum-dark px-[6px]">
      <div className="flex w-2/4 flex-col gap-[3px] pr-[2px]">
        <div className="h-[2.5px] w-full rounded-full bg-platinum" />
        <div className="h-[2.5px] w-full rounded-full bg-platinum" />
      </div>
      <div className="flex w-2/4 flex-col gap-[3px]">
        <div className="h-[2.5px] w-full rounded-full bg-platinum" />
        <div className="h-[2.5px] w-full rounded-full bg-platinum" />
      </div>
    </div>
  </div>
);

const StatCard = ({
  title,
  value,
  icon,
}: {
  title?: string;
  value?: string;
  icon?: React.ReactNode;
}) => (
  <div className="flex items-center gap-6 rounded-xl border border-[hsl(var(--platinum--dark))] bg-card p-6 text-card-foreground shadow-xl shadow-platinum-dark transition-all hover:scale-[102%]">
    <div className="hidden md:block">{icon}</div>
    <div>
      <Heading variant="h4-all-caps">{title}</Heading>
      <Heading variant="h1">{value}</Heading>
    </div>
  </div>
);

function Home({ searchParams }: IndexPageProps) {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Dashboard"
          subHeaderText="Welcome to Fresco! This page provides an overview of your recent activity and key metrics."
        />
      </ResponsiveContainer>
      <Divider />
      <ResponsiveContainer
        className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
        maxWidth="5xl"
      >
        <Link href="/dashboard/protocols">
          <StatCard title="Protocols" value="5" icon={<ProtocolIcon />} />
        </Link>
        <Link href="/dashboard/participants">
          <StatCard
            title="Participants"
            value="130"
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
          <StatCard title="Interviews" value="24" icon={<InterviewIcon />} />
        </Link>
      </ResponsiveContainer>
      <Divider />
      <ResponsiveContainer>
        <Heading variant="h2">Recent Activity</Heading>
        <Paragraph>
          This table summarizes the most recent activity within Fresco. Use it
          to keep track of new protocols, interviews, and participants.
        </Paragraph>
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl">
        <Section>
          <ActivityFeed searchParams={searchParams} />
        </Section>
      </ResponsiveContainer>
    </>
  );
}

export default Home;
