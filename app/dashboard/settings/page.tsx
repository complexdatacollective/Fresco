import { Suspense } from 'react';
import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch';
import ApiTokenManagement from '~/components/ApiTokenManagement';
import DisableAnalyticsSwitch from '~/components/DisableAnalyticsSwitch';
import LimitInterviewsSwitch from '~/components/LimitInterviewsSwitch';
import PreviewModeAuthSwitch from '~/components/PreviewModeAuthSwitch';
import PreviewModeSwitch from '~/components/PreviewModeSwitch';
import SettingsCard, {
  SettingsCardSkeleton,
} from '~/components/settings/SettingsCard';
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
  getPreviewMode,
  requireAppNotExpired,
} from '~/queries/appSettings';
import { getUsers } from '~/queries/users';
import { requirePageAuth } from '~/utils/auth';
import AnalyticsButton from '../_components/AnalyticsButton';
import RecruitmentTestSectionServer from '../_components/RecruitmentTestSectionServer';
import ResetButton from '../_components/ResetButton';
import UpdateUploadThingTokenAlert from '../_components/UpdateUploadThingTokenAlert';
import UpdateInstallationId from './_components/UpdateInstallationId';
import UpdateUploadThingToken from './_components/UpdateUploadThingToken';
import UserManagement from './_components/UserManagement';
import ReadOnlyEnvAlert from './ReadOnlyEnvAlert';

function getSettingsSections(): SettingsSection[] {
  const sections: SettingsSection[] = [
    { id: 'app-version', title: 'App Version' },
    { id: 'user-management', title: 'User Management' },
    { id: 'configuration', title: 'Configuration' },
    { id: 'interview-settings', title: 'Interview Settings' },
    { id: 'privacy', title: 'Privacy' },
    { id: 'preview-mode', title: 'Preview Mode' },
  ];

  if (env.NODE_ENV === 'development' || !env.SANDBOX_MODE) {
    sections.push({
      id: 'developer-tools',
      title: 'Developer Tools',
      variant: 'destructive',
    });
  }

  return sections;
}

function SettingsContentSkeleton() {
  const sections = getSettingsSections();

  return (
    <div className="mx-auto max-w-full">
      <div className="flex gap-8">
        <SettingsNavigation sections={sections} />
        <div className="min-w-0 flex-1 space-y-6">
          <SettingsCardSkeleton rows={1} />
          <SettingsCardSkeleton rows={1} />
          <SettingsCardSkeleton rows={2} />
          <SettingsCardSkeleton rows={3} />
          <SettingsCardSkeleton rows={1} />
          <SettingsCardSkeleton rows={3} />
          {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
            <SettingsCardSkeleton rows={3} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <>
      <PageHeader
        headerText="Settings"
        subHeaderText="Here you can configure your installation of Fresco."
        data-testid="settings-page-header"
      />
      <Suspense fallback={<SettingsContentSkeleton />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  await requireAppNotExpired();
  const session = await requirePageAuth();

  const [
    installationId,
    disableSmallScreenOverlay,
    uploadThingKey,
    previewMode,
    users,
  ] = await Promise.all([
    getAppSetting('installationId'),
    getAppSetting('disableSmallScreenOverlay'),
    getAppSetting('uploadThingToken'),
    getPreviewMode(),
    getUsers(),
  ]);

  const apiTokens = previewMode ? await getApiTokens() : [];
  const sections = getSettingsSections();
  const previewModeIsReadOnly = env.PREVIEW_MODE !== undefined;

  return (
    <div className="mx-auto max-w-full">
      <div className="flex gap-8">
        <SettingsNavigation sections={sections} />
        <div className="min-w-0 flex-1 space-y-6">
          <Suspense fallback={<VersionSectionSkeleton />}>
            <VersionSection />
          </Suspense>

          <SettingsCard id="user-management" title="User Management">
            <UserManagement
              users={users}
              currentUserId={session.user.userId}
              currentUsername={session.user.username}
            />
          </SettingsCard>

          <SettingsCard id="configuration" title="Configuration" divideChildren>
            <SettingsField
              label="Installation ID"
              description="This is the unique identifier for your installation of Fresco. This ID is used to track analytics data and for other internal purposes."
            >
              <UpdateInstallationId installationId={installationId} />
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

          <SettingsCard
            id="interview-settings"
            title="Interview Settings"
            divideChildren
          >
            <SettingsField
              label="Anonymous Recruitment"
              description="If anonymous recruitment is enabled, you may generate an anonymous participation URL. This URL can be shared with participants to allow them to self-enroll in your study."
              testId="anonymous-recruitment-field"
              control={
                <Suspense fallback={<SwitchSkeleton />}>
                  <AnonymousRecruitmentSwitch />
                </Suspense>
              }
            />
            <SettingsField
              label="Limit Interviews"
              testId="limit-interviews-field"
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
              {disableSmallScreenOverlay && (
                <Alert variant="warning">
                  <AlertDescription>
                    Ensure that you test your interview thoroughly on a small
                    screen when disabling this warning. Fresco is designed to
                    work best on larger screens, and using it on a small screen
                    may lead to a poor user experience for participants.
                  </AlertDescription>
                </Alert>
              )}
            </SettingsField>
          </SettingsCard>

          <SettingsCard id="privacy" title="Privacy" divideChildren>
            <SettingsField
              label="Disable Analytics"
              testId="disable-analytics-field"
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

          <SettingsCard id="preview-mode" title="Preview Mode" divideChildren>
            <SettingsField
              label="Enable Preview Mode"
              description="Enable preview mode to allow uploading and testing protocols directly from Architect Web on your private instance of Fresco."
              testId="enable-preview-mode-field"
              control={
                <Suspense fallback={<SwitchSkeleton />}>
                  <PreviewModeSwitch />
                </Suspense>
              }
            >
              {previewModeIsReadOnly && <ReadOnlyEnvAlert />}
            </SettingsField>
            <SettingsField
              label="Authentication"
              testId="preview-mode-auth-field"
              description="When enabled, the preview protocol upload endpoint requires authentication via API token or user session. When disabled, anyone can upload preview protocols."
              control={
                <Suspense fallback={<SwitchSkeleton />}>
                  <PreviewModeAuthSwitch disabled={!previewMode} />
                </Suspense>
              }
            >
              <Alert variant="warning">
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription>
                  Disabling authentication allows anyone with the URL of your
                  study to upload protocols. Only disable this in trusted
                  environments.
                </AlertDescription>
              </Alert>
            </SettingsField>
            <SettingsField
              label="API Tokens"
              testId="api-tokens-field"
              description={
                <>
                  API tokens are used to authenticate preview protocol uploads
                  from Architect Web.
                </>
              }
            >
              <ApiTokenManagement tokens={apiTokens} disabled={!previewMode} />
            </SettingsField>
          </SettingsCard>

          {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
            <SettingsCard
              id="developer-tools"
              title="Developer Tools"
              variant="destructive"
              divideChildren
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
    </div>
  );
}
