import ResponsiveContainer from '~/components/ResponsiveContainer';
import Section from '~/components/layout/Section';
import PageHeader from '~/components/ui/typography/PageHeader';
import Paragraph from '~/components/ui/typography/Paragraph';
import ResetButton from '../_components/ResetButton';
import AnalyticsButton from '../_components/AnalyticsButton';
import { Suspense } from 'react';
import RecruitmentTestSection from '../_components/RecruitmentTestSection';
import Heading from '~/components/ui/typography/Heading';

export default function Settings() {
  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Settings"
          subHeaderText="Here you can configure your installation of Fresco."
        />
      </ResponsiveContainer>
      <ResponsiveContainer maxWidth="5xl" className="gap-4">
        <Section>
          <div>
            <Heading variant="h4-all-caps" className="mb-2">
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
        <Suspense fallback={<div>Thinking about it...</div>}>
          <RecruitmentTestSection />
        </Suspense>
      </ResponsiveContainer>
    </>
  );
}
