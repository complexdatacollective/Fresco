import { AlertTriangle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import { unstable_noStore } from 'next/cache';
import Markdown from 'react-markdown';
import { z } from 'zod/v3';
import Link from '~/components/Link';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { env } from '~/env';
import trackEvent from '~/lib/analytics';
import { ensureError } from '~/utils/ensureError';
import { getSemverUpdateType, semverSchema } from '~/utils/semVer';
import SettingsSection from './layout/SettingsSection';
import { Button } from './ui/Button';
import Heading from './ui/typography/Heading';
import Paragraph from './ui/typography/Paragraph';

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
  unstable_noStore();

  if (!env.APP_VERSION) {
    return {
      error: true,
    };
  }

  try {
    const currentVersion = semverSchema.parse(env.APP_VERSION);

    const response = await fetch(
      'https://api.github.com/repos/complexdatacollective/fresco/releases/latest',
      { cache: 'no-store' },
    );
    const data = await response.json();
    const { latestVersion, releaseNotes, releaseUrl } =
      GithubApiResponseSchema.parse(data);

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
    void trackEvent({
      type: 'Error',
      message: error.message,
      name: 'VersionSection',
    });

    return {
      error: true,
    };
  }
}

export default async function VersionSection() {
  const { error, updateType, latestVersion, releaseNotes, releaseUrl } =
    await checkForUpdate();

  return (
    <SettingsSection heading="App Version">
      <Paragraph>
        You are currently running Fresco {env.APP_VERSION} ({env.COMMIT_HASH}
        ).
      </Paragraph>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error fetching update information</AlertTitle>
          <AlertDescription>
            An error occurred while fetching the latest version information.
          </AlertDescription>
        </Alert>
      )}

      {!error && !updateType && (
        <Alert variant="success" className="mt-4">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>You are up to date</AlertTitle>
          <AlertDescription>
            You are running the latest version of Fresco.
          </AlertDescription>
        </Alert>
      )}

      {updateType && (
        <>
          <Alert variant="info" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>{latestVersion} of Fresco is available!</AlertTitle>
            {updateType === 'major' && (
              <Alert variant="destructive" className="my-4 ml-6 w-fit">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Major update</AlertTitle>
                <AlertDescription>
                  This update is a major version bump. A new major version may
                  change the interview experience, or require additional
                  configuration before the app can continue to be used. It
                  should NOT be done while collecting data. If you are actively
                  collecting data, please wait until data collection is complete
                  before updating.
                </AlertDescription>
              </Alert>
            )}
            <AlertDescription>
              To upgrade your Fresco version, you will need to sync your fork
              with the latest version of the Fresco repository. For more
              information, please refer to the{' '}
              <Link
                href="https://documentation.networkcanvas.com/en/fresco/deployment/upgrading"
                target="_blank"
              >
                upgrade documentation.
              </Link>
            </AlertDescription>
            <article className="prose-headings:foreground prose text-foreground prose-headings:text-sm prose-headings:font-extrabold prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-foreground prose-a:text-link my-4 max-w-full text-sm">
              <Markdown>{releaseNotes}</Markdown>
            </article>
            <div className="text-right">
              <a href={releaseUrl} target="_blank">
                <Button variant="info">View Full Release Notes</Button>
              </a>
            </div>
          </Alert>
        </>
      )}
    </SettingsSection>
  );
}

// Skeleton
export function VersionSectionSkeleton() {
  return (
    <SettingsSection heading="App Version">
      <Paragraph>
        You are currently running Fresco {env.APP_VERSION} ({env.COMMIT_HASH}
        ).
      </Paragraph>
      <div className="my-4 flex h-24 items-center justify-center gap-4">
        <Loader2 className="animate-spin" />
        <Heading>Checking for updates...</Heading>
      </div>
    </SettingsSection>
  );
}
