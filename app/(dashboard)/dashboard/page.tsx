import ResponsiveContainer from '~/components/ResponsiveContainer';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { Card, CardHeader, CardTitle } from '~/components/ui/card';
import { BookOpen, Calendar, Users } from 'lucide-react';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import { Divider } from '~/components/ui/Divider';
import {
  ActivityFeed,
  type IndexPageProps,
} from './_components/ActivityFeed/ActivityFeed';

const StatCard = ({
  title,
  value,
  icon,
}: {
  title?: string;
  value?: string;
  icon?: React.ReactNode;
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center">
        {icon}
        <div>
          <CardTitle>{title}</CardTitle>
          <Paragraph>{value}</Paragraph>
        </div>
      </div>
    </CardHeader>
  </Card>
);

function Home({ searchParams }: IndexPageProps) {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Dashboard"
          subHeaderText="Welcome to the dashboard of your installation of Fresco."
        />
      </ResponsiveContainer>
      <ResponsiveContainer
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        maxWidth="5xl"
      >
        <StatCard
          title="Protocols"
          value="5"
          icon={<BookOpen size={30} className="mr-2" />}
        />
        <StatCard
          title="Participants"
          value="130"
          icon={<Users size={30} className="mr-2" />}
        />
        <StatCard
          title="Interviews"
          value="24"
          icon={<Calendar size={30} className="mr-2" />}
        />
      </ResponsiveContainer>
      <ResponsiveContainer>
        <Heading variant="h2">Recent Activity</Heading>
        <Paragraph>Here you can see your recent activity.</Paragraph>
      </ResponsiveContainer>
        <ResponsiveContainer maxWidth="5xl">
          <Section>
        <ActivityFeed searchParams={searchParams} />
        </Section>
      </ResponsiveContainer>
      <Divider />
    </>
  );
}

export default Home;
