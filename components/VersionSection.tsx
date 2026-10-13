import { Loader2 } from 'lucide-react';
import 'server-only';
import { after } from 'next/server';
import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
// eslint-disable-next-line no-restricted-imports -- server-only file (uses 'server-only' import)
import { z } from 'zod';

import { defineMessages } from '@codaco/app-i18n/messages';
import { Alert, AlertDescription, AlertTitle } from '@codaco/fresco-ui/Alert';
import { Button } from '@codaco/fresco-ui/Button';
import Heading from '@codaco/fresco-ui/typography/Heading';
import { ensureError } from '@codaco/shared-consts';
import Link from '~/components/Link';
import { env } from '~/env';
import { getServerIntl } from '~/i18n/server';
import { captureException, flushPostHog } from '~/lib/posthog-server';
import { getSemverUpdateType, semverSchema } from '~/utils/semVer';

import SettingsField from './settings/SettingsField';

const messages = defineMessages({
  appVersion: {
    id: 'fresco.VersionSection.appVersion',
    defaultMessage: 'App Version',
    description: 'Researcher-facing VersionSection: App Version',
  },
  youAreCurrentlyRunningFresco: {
    id: 'fresco.VersionSection.youAreCurrentlyRunningFresco',
    defaultMessage: 'You are currently running Fresco {value1} ({value2}).',
    description:
      'Researcher-facing VersionSection: You are currently running Fresco value (value).',
  },
  errorFetchingUpdateInformation: {
    id: 'fresco.VersionSection.errorFetchingUpdateInformation',
    defaultMessage: 'Error fetching update information',
    description:
      'Researcher-facing VersionSection: Error fetching update information',
  },
  anErrorOccurredWhileFetchingTheLatest: {
    id: 'fresco.VersionSection.anErrorOccurredWhileFetchingTheLatest',
    defaultMessage:
      'An error occurred while fetching the latest version information.',
    description:
      'Researcher-facing VersionSection: An error occurred while fetching the latest version information.',
  },
  youAreUpToDate: {
    id: 'fresco.VersionSection.youAreUpToDate',
    defaultMessage: 'You are up to date',
    description: 'Researcher-facing VersionSection: You are up to date',
  },
  youAreRunningTheLatestVersionOf: {
    id: 'fresco.VersionSection.youAreRunningTheLatestVersionOf',
    defaultMessage: 'You are running the latest version of Fresco.',
    description:
      'Researcher-facing VersionSection: You are running the latest version of Fresco.',
  },
  ofFrescoIsAvailable: {
    id: 'fresco.VersionSection.ofFrescoIsAvailable',
    defaultMessage: '{value1} of Fresco is available!',
    description:
      'Researcher-facing VersionSection: value of Fresco is available!',
  },
  majorUpdate: {
    id: 'fresco.VersionSection.majorUpdate',
    defaultMessage: 'Major update',
    description: 'Researcher-facing VersionSection: Major update',
  },
  thisUpdateIsAMajorVersionBump: {
    id: 'fresco.VersionSection.thisUpdateIsAMajorVersionBump',
    defaultMessage:
      'This update is a major version bump. A new major version may change the interview experience, or require additional configuration before the app can continue to be used. It should NOT be done while collecting data. If you are actively collecting data, please wait until data collection is complete before updating.',
    description:
      'Researcher-facing VersionSection: This update is a major version bump. A new major version may change the interview experience, or require additional conf',
  },
  toUpgradeYourFrescoVersionYouWill: {
    id: 'fresco.VersionSection.toUpgradeYourFrescoVersionYouWill',
    defaultMessage:
      'To upgrade your Fresco version, you will need to sync your fork with the latest version of the Fresco repository. For more information, please refer to the <tag1> upgrade documentation. </tag1>',
    description:
      'Researcher-facing VersionSection: To upgrade your Fresco version, you will need to sync your fork with the latest version of the Fresco repository. For mo',
  },
  viewFullReleaseNotes: {
    id: 'fresco.VersionSection.viewFullReleaseNotes',
    defaultMessage: 'View Full Release Notes',
    description: 'Researcher-facing VersionSection: View Full Release Notes',
  },
  checkingForUpdates: {
    id: 'fresco.VersionSection.checkingForUpdates',
    defaultMessage: 'Checking for updates...',
    description: 'Researcher-facing VersionSection: Checking for updates...',
  },
});

const renderUpgradeDocsLinkChunks = (chunks: ReactNode[]) => (
  <Link
    href="https://documentation.networkcanvas.com/en/fresco/deployment/upgrading"
    target="_blank"
  >
    {chunks}
  </Link>
);

const GithubApiResponseSchema = z
  .object({
    html_url: z.string().url(),
    tag_name: semverSchema,
    body: z.string(),
  })
  // Rename values to something more useful
  .transform((value) => ({
    latestVersion: value.tag_name,
    releaseNotes: value.body,
    releaseUrl: value.html_url,
  }));

async function checkForUpdate() {
  if (!env.APP_VERSION) {
    return {
      error: true,
    };
  }

  // In CI environments, skip the API call and return "up to date" to ensure
  // consistent visual snapshots (server-side fetch can't be mocked by Playwright)
  if (env.CI) {
    return {
      updateType: null,
      error: false,
    };
  }

  try {
    const currentVersion = semverSchema.parse(env.APP_VERSION);

    const response = await fetch(
      'https://api.github.com/repos/complexdatacollective/fresco/releases/latest',
      { next: { revalidate: 3600 } },
    );

    // A non-2xx answer (typically a 403 from the unauthenticated rate limit)
    // is an expected outcome, not a defect worth reporting.
    if (!response.ok) {
      return {
        error: true,
      };
    }

    const parsed = GithubApiResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error(
        `GitHub releases response did not match the expected shape: ${parsed.error.message}`,
      );
    }
    const { latestVersion, releaseNotes, releaseUrl } = parsed.data;

    const updateType = getSemverUpdateType(currentVersion, latestVersion);

    return {
      updateType,
      latestVersion: latestVersion.toString(),
      releaseNotes,
      releaseUrl,
      error: false,
    };
  } catch (e) {
    const error = ensureError(e);
    after(async () => {
      await captureException(error);
      await flushPostHog();
    });

    return {
      error: true,
    };
  }
}

export default async function VersionSection() {
  const intl = await getServerIntl();

  const { error, updateType, latestVersion, releaseNotes, releaseUrl } =
    await checkForUpdate();

  return (
    <SettingsField
      label={intl.formatMessage(messages.appVersion)}
      description={intl.formatMessage(messages.youAreCurrentlyRunningFresco, {
        value1: env.APP_VERSION ?? 'unknown',
        value2: env.CI ? 'ci-build' : env.COMMIT_HASH,
      })}
    >
      {error && (
        <Alert variant="destructive">
          <AlertTitle>
            {intl.formatMessage(messages.errorFetchingUpdateInformation)}
          </AlertTitle>
          <AlertDescription>
            {intl.formatMessage(messages.anErrorOccurredWhileFetchingTheLatest)}
          </AlertDescription>
        </Alert>
      )}

      {!error && !updateType && (
        <Alert variant="success">
          <AlertTitle>{intl.formatMessage(messages.youAreUpToDate)}</AlertTitle>
          <AlertDescription>
            {intl.formatMessage(messages.youAreRunningTheLatestVersionOf)}
          </AlertDescription>
        </Alert>
      )}

      {updateType && (
        <Alert variant="info">
          <AlertTitle>
            {intl.formatMessage(messages.ofFrescoIsAvailable, {
              value1: latestVersion,
            })}
          </AlertTitle>
          {updateType === 'major' && (
            <Alert variant="destructive" className="my-4 ml-6 w-fit">
              <AlertTitle>
                {intl.formatMessage(messages.majorUpdate)}
              </AlertTitle>
              <AlertDescription>
                {intl.formatMessage(messages.thisUpdateIsAMajorVersionBump)}
              </AlertDescription>
            </Alert>
          )}
          <AlertDescription>
            {intl.formatMessage(messages.toUpgradeYourFrescoVersionYouWill, {
              tag1: renderUpgradeDocsLinkChunks,
            })}
          </AlertDescription>
          <article className="text-text [&_a]:text-link my-4 max-w-full text-sm [&_h1]:text-sm [&_h1]:font-extrabold [&_h1]:tracking-widest [&_h1]:uppercase [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:tracking-widest [&_h2]:uppercase [&_h3]:text-sm [&_h3]:font-extrabold [&_h3]:tracking-widest [&_h3]:uppercase [&_h4]:text-sm [&_h4]:font-extrabold [&_h4]:tracking-widest [&_h4]:uppercase [&_h5]:text-sm [&_h5]:font-extrabold [&_h5]:tracking-widest [&_h5]:uppercase [&_h6]:text-sm [&_h6]:font-extrabold [&_h6]:tracking-widest [&_h6]:uppercase">
            <Markdown>{releaseNotes}</Markdown>
          </article>
          <div className="text-right">
            <a href={releaseUrl} target="_blank">
              <Button color="info">
                {intl.formatMessage(messages.viewFullReleaseNotes)}
              </Button>
            </a>
          </div>
        </Alert>
      )}
    </SettingsField>
  );
}

export async function VersionSectionSkeleton() {
  const intl = await getServerIntl();

  return (
    <SettingsField
      label={intl.formatMessage(messages.appVersion)}
      description={intl.formatMessage(messages.youAreCurrentlyRunningFresco, {
        value1: env.APP_VERSION ?? 'unknown',
        value2: env.CI ? 'ci-build' : env.COMMIT_HASH,
      })}
    >
      <div className="my-4 flex h-24 items-center justify-center gap-4">
        <Loader2 className="animate-spin" />
        <Heading>{intl.formatMessage(messages.checkingForUpdates)}</Heading>
      </div>
    </SettingsField>
  );
}
