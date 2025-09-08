import { Suspense } from 'react';
import SettingsSection from '~/components/layout/SettingsSection';
import Paragraph from '~/components/typography/Paragraph';
import { getAppSetting } from '~/queries/appSettings';
import { getParticipants } from '~/queries/participants';
import { getProtocols } from '~/queries/protocols';
import RecruitmentTestSection from './RecruitmentTestSection';

export default function RecruitmentTestSectionServer() {
  const protocolsPromise = getProtocols();
  const participantsPromise = getParticipants();
  const allowAnonymousRecruitmentPromise = getAppSetting(
    'allowAnonymousRecruitment',
  );

  return (
    <SettingsSection devOnly heading="Recruitment Test Section">
      <Paragraph>This section allows you to test recruitment.</Paragraph>
      <Suspense fallback="Loading">
        <RecruitmentTestSection
          protocolsPromise={protocolsPromise}
          participantsPromise={participantsPromise}
          allowAnonymousRecruitmentPromise={allowAnonymousRecruitmentPromise}
        />
      </Suspense>
    </SettingsSection>
  );
}
