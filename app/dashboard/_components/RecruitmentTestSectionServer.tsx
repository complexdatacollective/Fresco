import Section from '~/components/layout/Section';
import Heading from '~/components/ui/typography/Heading';
import Paragraph from '~/components/ui/typography/Paragraph';
import { getAnonymousRecruitmentStatus } from '~/queries/appSettings';
import { getParticipants } from '~/queries/participants';
import { getProtocols } from '~/queries/protocols';
import RecruitmentTestSection from './RecruitmentTestSection';

export default function RecruitmentTestSectionServer() {
  const protocolsPromise = getProtocols();
  const participantsPromise = getParticipants();
  const allowAnonymousRecruitmentPromise = getAnonymousRecruitmentStatus();

  return (
    <Section>
      <Heading variant="h4-all-caps">Recruitment Test Section</Heading>
      <Paragraph>This section allows you to test recruitment.</Paragraph>
      <RecruitmentTestSection
        protocolsPromise={protocolsPromise}
        participantsPromise={participantsPromise}
        allowAnonymousRecruitmentPromise={allowAnonymousRecruitmentPromise}
      />
    </Section>
  );
}
