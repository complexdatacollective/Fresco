import { Suspense } from 'react';
import AnonymousRecruitmentSwitch from '~/components/AnonymousRecruitmentSwitch';
import DisableAnalyticsSwitch from '~/components/DisableAnalyticsSwitch';
import SettingsSection from '~/components/layout/SettingsSection';
import LimitInterviewsSwitch from '~/components/LimitInterviewsSwitch';
import Link from '~/components/Link';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import PageHeader from '~/components/ui/typography/PageHeader';
import Paragraph from '~/components/ui/typography/Paragraph';
import VersionSection, {
  VersionSectionSkeleton,
} from '~/components/VersionSection';
import { env } from '~/env';
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

  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="Settings"
          subHeaderText="Here you can configure your installation of Fresco."
        />
      </ResponsiveContainer>
      <ResponsiveContainer className="gap-4">
        <Suspense fallback={<VersionSectionSkeleton />}>
          <VersionSection />
        </Suspense>
        <SettingsSection heading="Installation ID">
          <Paragraph margin="none">
            This is the unique identifier for your installation of Fresco. This
            ID is used to track analytics data and for other internal purposes.
          </Paragraph>
          <UpdateInstallationId
            installationId={installationId}
            readOnly={!!env.INSTALLATION_ID}
          />
        </SettingsSection>
        <SettingsSection heading="UploadThing API Key">
          <Paragraph margin="none">
            This is the API key used to communicate with the UploadThing
            service. See our{' '}
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
          heading="Limit Interviews"
          controlArea={
            <Suspense fallback="Loading">
              <LimitInterviewsSwitch />
            </Suspense>
          }
        >
          <Paragraph margin="none">
            If this option is enabled, each participant will only be able to
            submit a single <strong>completed</strong> interview for each
            protocol (although they may have multiple incomplete interviews).
            Once an interview has been completed, attempting to start a new
            interview or to resume any other in-progress interview, will be
            prevented.
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
            If this option is enabled, no anonymous analytics data will be sent
            to the Network Canvas team.
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
        {env.NODE_ENV === 'development' && (
          // Only show the Analytics and Recruitment test sections in development
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
      </ResponsiveContainer>
    </>
  );
}
