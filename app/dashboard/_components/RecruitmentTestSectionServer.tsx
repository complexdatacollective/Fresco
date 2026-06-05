import { Suspense } from 'react';
import SettingsField from '~/components/settings/SettingsField';
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
    <SettingsField
      label="Recruitment Test"
      description="This section allows you to test recruitment."
    >
      <Suspense fallback="Loading...">
        <RecruitmentTestSection
          protocolsPromise={protocolsPromise}
          participantsPromise={participantsPromise}
          allowAnonymousRecruitmentPromise={allowAnonymousRecruitmentPromise}
        />
      </Suspense>
    </SettingsField>
  );
}
