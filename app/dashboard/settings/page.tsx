import { Suspense } from 'react';
import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch';
import ApiTokenManagement from '~/components/ApiTokenManagement';
import DisableAnalyticsSwitch from '~/components/DisableAnalyticsSwitch';
import SettingsSection from '~/components/layout/SettingsSection';
import LimitInterviewsSwitch from '~/components/LimitInterviewsSwitch';
import Link from '~/components/Link';
import PreviewModeAuthSwitch from '~/components/PreviewModeAuthSwitch';
import ToggleSmallScreenWarning from '~/components/ToggleSmallScreenWarning';
import PageHeader from '~/components/typography/PageHeader';
import Paragraph from '~/components/typography/Paragraph';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
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

export default async function Settings() {
  await requireAppNotExpired();
  await requirePageAuth();

  const installationId = await getInstallationId();
  const uploadThingKey = await getAppSetting('uploadThingToken');
  const apiTokens = env.PREVIEW_MODE ? await getApiTokens() : [];

  return (
    <>
      <PageHeader
        headerText="Settings"
        subHeaderText="Here you can configure your installation of Fresco."
      />
      <Suspense fallback={<VersionSectionSkeleton />}>
        <VersionSection />
      </Suspense>
      <SettingsSection heading="Installation ID">
        <Paragraph margin="none">
          This is the unique identifier for your installation of Fresco. This ID
          is used to track analytics data and for other internal purposes.
        </Paragraph>
        <UpdateInstallationId
          installationId={installationId ?? undefined}
          readOnly={!!env.INSTALLATION_ID}
        />
      </SettingsSection>
      <SettingsSection heading="UploadThing API Key">
        <Paragraph margin="none">
          This is the API key used to communicate with the UploadThing service.
          See our{' '}
          <Link href="https://documentation.networkcanvas.com/en/fresco/deployment/guide#create-a-storage-bucket-using-uploadthing">
            deployment documentation
          </Link>{' '}
          for information about how to obtain this key.
        </Paragraph>
        <UpdateUploadThingTokenAlert />
        <UpdateUploadThingToken uploadThingKey={uploadThingKey} />
      </SettingsSection>
      <SettingsSection
        heading="Anonymous Recruitment"
        controlArea={
          <Suspense fallback="Loading">
            <AnonymousRecruitmentSwitch />
          </Suspense>
        }
      >
        <Paragraph margin="none">
          If anonymous recruitment is enabled, you may generate an anonymous
          participation URL. This URL can be shared with participants to allow
          them to self-enroll in your study.
        </Paragraph>
      </SettingsSection>
      <SettingsSection
        heading="Disable Small Screen Warning"
        controlArea={
          <Suspense fallback="Loading">
            <ToggleSmallScreenWarning />
          </Suspense>
        }
      >
        <Paragraph margin="none">
          If this option is enabled, the warning about using Fresco on a small
          screen will be disabled.
        </Paragraph>
        <Alert variant="warning">
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Ensure that you test your interview thoroughly on a small screen
            before disabling this warning. Fresco is designed to work best on
            larger screens, and using it on a small screen may lead to a poor
            user experience for participants.
          </AlertDescription>
        </Alert>
      </SettingsSection>
      <SettingsSection
        heading="Limit Interviews"
        controlArea={
          <Suspense fallback="Loading">
            <LimitInterviewsSwitch />
          </Suspense>
        }
      >
        <Paragraph margin="none">
          If this option is enabled, each participant will only be able to
          submit a single <strong>completed</strong> interview for each protocol
          (although they may have multiple incomplete interviews). Once an
          interview has been completed, attempting to start a new interview or
          to resume any other in-progress interview, will be prevented.
        </Paragraph>
      </SettingsSection>
      <SettingsSection
        heading="Disable Analytics"
        controlArea={
          <Suspense fallback="Loading">
            <DisableAnalyticsSwitch />
          </Suspense>
        }
      >
        <Paragraph margin="none">
          If this option is enabled, no anonymous analytics data will be sent to
          the Network Canvas team.
        </Paragraph>
        {!!env.DISABLE_ANALYTICS && <ReadOnlyEnvAlert />}
      </SettingsSection>
      {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
        <SettingsSection
          devOnly
          heading="Reset Settings"
          controlArea={<ResetButton />}
        >
          <Paragraph margin="none">
            Delete all data and reset Fresco to its default state.
          </Paragraph>
        </SettingsSection>
      )}
      {env.PREVIEW_MODE && (
        <>
          <SettingsSection
            heading="Preview Mode Authentication"
            controlArea={
              <Suspense fallback="Loading">
                <PreviewModeAuthSwitch />
              </Suspense>
            }
          >
            <Paragraph margin="none">
              When enabled, the preview protocol upload endpoint requires
              authentication via API token or user session. When disabled,
              anyone can upload preview protocols.
            </Paragraph>
            <Alert variant="warning">
              <AlertTitle>Security Warning</AlertTitle>
              <AlertDescription>
                Disabling authentication allows anyone to upload protocols to
                this instance. Only disable this in trusted environments.
              </AlertDescription>
            </Alert>
          </SettingsSection>
          <SettingsSection heading="API Tokens">
            <Paragraph margin="none">
              API tokens can be used to authenticate preview protocol uploads.
              Use these tokens in the Authorization header as{' '}
              <code>Bearer {'<token>'}</code>.
            </Paragraph>
            <ApiTokenManagement tokens={apiTokens} />
          </SettingsSection>
        </>
      )}
      {(env.NODE_ENV === 'development' || !env.SANDBOX_MODE) && (
        <>
          <SettingsSection
            devOnly
            heading="Send Test Analytics Event"
            controlArea={<AnalyticsButton />}
          >
            <Paragraph margin="none">
              This will send a test analytics event to the Fresco analytics
              server.
            </Paragraph>
          </SettingsSection>
          <RecruitmentTestSectionServer />
        </>
      )}
    </>
  );
}
