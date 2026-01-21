import { Suspense } from 'react';
import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch';
import ApiTokenManagement from '~/components/ApiTokenManagement';
import DisableAnalyticsSwitch from '~/components/DisableAnalyticsSwitch';
import LimitInterviewsSwitch from '~/components/LimitInterviewsSwitch';
import PreviewModeAuthSwitch from '~/components/PreviewModeAuthSwitch';
import SettingsCard from '~/components/settings/SettingsCard';
import SettingsField from '~/components/settings/SettingsField';
import SettingsNavigation, {
  type SettingsSection,
} from '~/components/settings/SettingsNavigation';
import ToggleSmallScreenWarning from '~/components/ToggleSmallScreenWarning';
import PageHeader from '~/components/typography/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import Link from '~/components/ui/Link';
import { SwitchSkeleton } from '~/components/ui/switch';
import VersionSection, {
  VersionSectionSkeleton,
} from '~/components/VersionSection';
import { env } from '~/env';
import { getApiTokens } from '~/queries/apiTokens';
import {
  getAppSetting,
  getInstallationId,
  requireAppNotExpired,
} from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import AnalyticsButton from '../_components/AnalyticsButton';
import RecruitmentTestSectionServer from '../_components/RecruitmentTestSectionServer';
import ResetButton from '../_components/ResetButton';
import UpdateUploadThingTokenAlert from '../_components/UpdateUploadThingTokenAlert';
import UpdateInstallationId from './_components/UpdateInstallationId';
import UpdateUploadThingToken from './_components/UpdateUploadThingToken';
import ReadOnlyEnvAlert from './ReadOnlyEnvAlert';

function getSettingsSections(): SettingsSection[] {
  const sections: SettingsSection[] = [
    { id: 'app-version', title: 'App Version' },
    { id: 'configuration', title: 'Configuration' },
    { id: 'interview-settings', title: 'Interview Settings' },
    { id: 'privacy', title: 'Privacy' },
  ];

  if (env.PREVIEW_MODE) {
    sections.push({ id: 'preview-mode', title: 'Preview Mode' });
  }

  if (env.NODE_ENV === 'development' || !env.SANDBOX_MODE) {
    sections.push({
      id: 'developer-tools',
      title: 'Developer Tools',
      variant: 'destructive',
    });
  }

  return sections;
}

export default async function Settings() {
  await requireAppNotExpired();
  await requirePageAuth();

  const installationId = await getInstallationId();
  const uploadThingKey = await getAppSetting('uploadThingToken');
  const apiTokens = env.PREVIEW_MODE ? await getApiTokens() : [];
  const sections = getSettingsSections();

  return (
    <>
      <PageHeader
        headerText="Settings"
        subHeaderText="Here you can configure your installation of Fresco."
      />
      <div className="flex gap-8">
        <SettingsNavigation sections={sections} />
        <div className="min-w-0 flex-1 space-y-6">
          <Suspense fallback={<VersionSectionSkeleton />}>
            <VersionSection />
          </Suspense>

          <SettingsCard id="configuration" title="Configuration">
            <SettingsField
              label="Installation ID"
              description="This is the unique identifier for your installation of Fresco. This ID is used to track analytics data and for other internal purposes."
            >
              <UpdateInstallationId
                installationId={installationId ?? undefined}
                readOnly={!!env.INSTALLATION_ID}
              />
            </SettingsField>
            <SettingsField
              label="UploadThing API Key"
              description={
                <>
                  This is the API key used to communicate with the UploadThing
                  service. See our{' '}
                  <Link href="https://documentation.networkcanvas.com/en/fresco/deployment/guide#create-a-storage-bucket-using-uploadthing">
                    deployment documentation
                  </Link>{' '}
                  for information about how to obtain this key.
                </>
              }
            >
              <UpdateUploadThingTokenAlert />
              <UpdateUploadThingToken uploadThingKey={uploadThingKey} />
            </SettingsField>
          </SettingsCard>

          <SettingsCard id="interview-settings" title="Interview Settings">
            <SettingsField
              label="Anonymous Recruitment"
              description="If anonymous recruitment is enabled, you may generate an anonymous participation URL. This URL can be shared with participants to allow them to self-enroll in your study."
              control={
                <Suspense fallback={<SwitchSkeleton />}>
                  <AnonymousRecruitmentSwitch />
                </Suspense>
              }
            />
            <SettingsField
              label="Limit Interviews"
              description={
                <>
                  If this option is enabled, each participant will only be able
                  to submit a single <strong>completed</strong> interview for
                  each protocol (although they may have multiple incomplete
                  interviews). Once an interview has been completed, attempting
                  to start a new interview or to resume any other in-progress
                  interview, will be prevented.
                </>
              }
              control={
                <Suspense fallback={<SwitchSkeleton />}>
                  <LimitInterviewsSwitch />
                </Suspense>
              }
            />
            <SettingsField
              label="Disable Small Screen Warning"
              description="If this option is enabled, the warning about using Fresco on a small screen will be disabled."
              control={
                <Suspense fallback={<SwitchSkeleton />}>
                  <ToggleSmallScreenWarning />
                </Suspense>
              }
            >
              <Alert variant="warning">
                <AlertDescription>
                  Ensure that you test your interview thoroughly on a small
                  screen before disabling this warning. Fresco is designed to
                  work best on larger screens, and using it on a small screen
                  may lead to a poor user experience for participants.
                </AlertDescription>
              </Alert>
            </SettingsField>
          </SettingsCard>

          <SettingsCard id="privacy" title="Privacy">
            <SettingsField
              label="Disable Analytics"
              description="If this option is enabled, no anonymous analytics data will be sent to the Network Canvas team."
              control={
                <Suspense fallback={<SwitchSkeleton />}>
                  <DisableAnalyticsSwitch />
                </Suspense>
              }
            >
              {!!env.DISABLE_ANALYTICS && <ReadOnlyEnvAlert />}
            </SettingsField>
          </SettingsCard>

          {env.PREVIEW_MODE && (
            <SettingsCard id="preview-mode" title="Preview Mode">
              <SettingsField
                label="Authentication"
                description="When enabled, the preview protocol upload endpoint requires authentication via API token or user session. When disabled, anyone can upload preview protocols."
                control={
                  <Suspense fallback={<SwitchSkeleton />}>
                    <PreviewModeAuthSwitch />
                  </Suspense>
                }
              >
                <Alert variant="warning">
                  <AlertTitle>Security Warning</AlertTitle>
                  <AlertDescription>
                    Disabling authentication allows anyone to upload protocols
                    to this instance. Only disable this in trusted environments.
                  </AlertDescription>
                </Alert>
              </SettingsField>
              <SettingsField
                label="API Tokens"
                description={
                  <>
                    API tokens can be used to authenticate preview protocol
                    uploads. Use these tokens in the Authorization header as{' '}
                    <code>Bearer {'<token>'}</code>.
                  </>
                }
              >
                <ApiTokenManagement tokens={apiTokens} />
              </SettingsField>
            </SettingsCard>
          )}

          {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
            <SettingsCard
              id="developer-tools"
              title="Developer Tools"
              variant="destructive"
            >
              <SettingsField
                label="Reset Settings"
                description="Delete all data and reset Fresco to its default state."
                control={<ResetButton />}
              />
              <SettingsField
                label="Send Test Analytics Event"
                description="This will send a test analytics event to the Fresco analytics server."
                control={<AnalyticsButton />}
              />
              <RecruitmentTestSectionServer />
            </SettingsCard>
          )}
        </div>
      </div>
    </>
  );
}
