import ResetButton from './_components/ResetButton';
import AnalyticsButton from './_components/AnalyticsButton';
import RecruitmentTestSection from './_components/RecruitmentTestSection';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { Card, CardHeader, CardTitle } from '~/components/ui/card';
import { BookOpen, Calendar, Users } from 'lucide-react';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';

const StatCard = ({
  title,
  value,
  icon,
}: {
  title?: string;
  value?: string;
  icon?: React.ReactNode;
}) => (
  <Card className="shadow-lg">
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

function Home() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Dashboard"
          subHeaderText="Welcome to the main dashboard of your installation of Fresco. Here you can see all of your projects, and manage your account."
        />
      </ResponsiveContainer>
      <ResponsiveContainer
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        size="large"
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
      <>
        <ResponsiveContainer>
          <PageHeader
            headerText="Settings"
            subHeaderText="Here you can configure your installation of Fresco."
          />
        </ResponsiveContainer>
        <ResponsiveContainer size="large" className="gap-4">
          <Section>
            <div>
              <Heading variant="h4" className="mb-2">
                Reset Settings
              </Heading>
              <Paragraph variant="noMargin" className="leading-normal">
                Project settings allow you to configure the project name, and
                other metadata.
              </Paragraph>
            </div>
            <ResetButton />
          </Section>
          <Section>
            <div>
              <Heading variant="h4" className="mb-2">
                Send Test Analytics Event
              </Heading>
              <Paragraph variant="noMargin" className="leading-normal">
                This will send a test analytics event to the Fresco analytics
                server.
              </Paragraph>
            </div>
            <AnalyticsButton />
          </Section>
          <RecruitmentTestSection />
        </ResponsiveContainer>
      </>
    </>
  );
}

export default Home;
