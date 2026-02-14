import { Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import Link from '~/components/ui/Link';
import { env } from '~/env';
import { trackServerException } from '~/lib/analytics/trackServerException';
import { ensureError } from '~/utils/ensureError';
import { getSemverUpdateType, semverSchema } from '~/utils/semVer';
import SettingsCard from './settings/SettingsCard';
import Heading from './typography/Heading';
import Paragraph from './typography/Paragraph';
import { Button } from './ui/Button';

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
    void trackServerException(error);

    return {
      error: true,
    };
  }
}

export default async function VersionSection() {
  const { error, updateType, latestVersion, releaseNotes, releaseUrl } =
    await checkForUpdate();

  return (
    <SettingsCard id="app-version" title="App Version">
      <Paragraph data-testid="app-version-info">
        You are currently running Fresco {env.APP_VERSION} (
        {env.CI ? 'ci-build' : env.COMMIT_HASH}).
      </Paragraph>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Error fetching update information</AlertTitle>
          <AlertDescription>
            An error occurred while fetching the latest version information.
          </AlertDescription>
        </Alert>
      )}

      {!error && !updateType && (
        <Alert variant="success" className="mt-4">
          <AlertTitle>You are up to date</AlertTitle>
          <AlertDescription>
            You are running the latest version of Fresco.
          </AlertDescription>
        </Alert>
      )}

      {updateType && (
        <>
          <Alert variant="info" className="mt-4">
            <AlertTitle>{latestVersion} of Fresco is available!</AlertTitle>
            {updateType === 'major' && (
              <Alert variant="destructive" className="my-4 ml-6 w-fit">
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
            <article className="text-text [&_a]:text-link my-4 max-w-full text-sm [&_h1]:text-sm [&_h1]:font-extrabold [&_h1]:tracking-widest [&_h1]:uppercase [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:tracking-widest [&_h2]:uppercase [&_h3]:text-sm [&_h3]:font-extrabold [&_h3]:tracking-widest [&_h3]:uppercase [&_h4]:text-sm [&_h4]:font-extrabold [&_h4]:tracking-widest [&_h4]:uppercase [&_h5]:text-sm [&_h5]:font-extrabold [&_h5]:tracking-widest [&_h5]:uppercase [&_h6]:text-sm [&_h6]:font-extrabold [&_h6]:tracking-widest [&_h6]:uppercase">
              <Markdown>{releaseNotes}</Markdown>
            </article>
            <div className="text-right">
              <a href={releaseUrl} target="_blank">
                <Button color="info">View Full Release Notes</Button>
              </a>
            </div>
          </Alert>
        </>
      )}
    </SettingsCard>
  );
}

// Skeleton
export function VersionSectionSkeleton() {
  return (
    <SettingsCard title="App Version">
      <Paragraph>
        You are currently running Fresco {env.APP_VERSION} (
        {env.CI ? 'ci-build' : env.COMMIT_HASH}).
      </Paragraph>
      <div className="my-4 flex h-24 items-center justify-center gap-4">
        <Loader2 className="animate-spin" />
        <Heading>Checking for updates...</Heading>
      </div>
    </SettingsCard>
  );
}
