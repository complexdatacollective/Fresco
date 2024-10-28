'use client';

import { CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { z } from 'zod';
import Link from '~/components/Link';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { env } from '~/env';
import { type getInstallationId } from '~/queries/appSettings';
import { ensureError } from '~/utils/ensureError';
import SettingsSection from './layout/SettingsSection';
import Paragraph from './ui/typography/Paragraph';

type SemVerUpdateType = 'major' | 'minor' | 'patch';

const GithubApiResponseSchema = z.object({
  tag_name: z.string().transform((tag) => tag.replace('v', '')), // remove the v to compare with APP_VERSION
  body: z.string(),
});

function getSemverUpdateType(
  currentVersion: string,
  mainVersion: string,
): SemVerUpdateType | null {
  if (currentVersion === mainVersion) return null;

  const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.');
  const [mainMajor, mainMinor, mainPatch] = mainVersion.split('.');

  if (mainMajor !== currentMajor) return 'major';
  if (mainMinor !== currentMinor) return 'minor';
  if (mainPatch !== currentPatch) return 'patch';

  return null;
}

export default function VersionSection({
  installationIdPromise,
}: {
  installationIdPromise: ReturnType<typeof getInstallationId>;
}) {
  const installationID = use(installationIdPromise);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    semVerUpdateType: SemVerUpdateType | null;
    releaseNotes: string;
    newVersion: string;
  } | null>(null);

  const updateTypeMessages = {
    major: {
      label: 'Major Update',
      message:
        'A major version bump will require additional configuration work, and should NOT be done while collecting data. If you are actively collecting data, please wait until data collection is complete before updating.',
    },
    minor: {
      label: 'Minor Update',
      message:
        'A minor version bump will add new features, but will not require any additional configuration work. Please review the release notes and update.',
    },
    patch: {
      label: 'Patch Update',
      message:
        'A patch version bump will include bug or security fixes. We recommend updating immediately.',
    },
  } as const;

  useEffect(() => {
    setIsLoading(true);
    fetch(
      `https://api.github.com/repos/complexdatacollective/fresco/releases/latest`,
    )
      .then((res) => res.json())
      .then(
        (result: unknown) => {
          setIsLoading(false);

          const response = GithubApiResponseSchema.parse(result);

          if (!env.APP_VERSION) {
            setError('Current APP_VERSION is not set in the environment.');
            return;
          }

          const semVerUpdateType =
            response.tag_name === env.APP_VERSION
              ? null
              : getSemverUpdateType(env.APP_VERSION, response.tag_name);

          setData({
            semVerUpdateType,
            releaseNotes: response.body,
            newVersion: response.tag_name,
          });
        },
        (error) => {
          const e = ensureError(error);
          setIsLoading(false);
          setError(e.message);
        },
      );
  }, []);

  const statusContent = (
    <div className="mt-4 flex flex-col items-center space-x-2">
      {isLoading ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin" />
          <Paragraph variant="smallText" margin="none">
            Checking for updates...
          </Paragraph>
        </>
      ) : error ? (
        <>
          <XCircle className="h-8 w-8 fill-destructive text-destructive-foreground" />
          <Paragraph
            className="text-destructive"
            variant="smallText"
            margin="none"
          >
            There was an error checking for updates.
          </Paragraph>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-8 w-8 fill-success text-success-foreground" />
          <Paragraph variant="smallText" margin="none">
            You are up to date!
          </Paragraph>
        </>
      )}
    </div>
  );

  return (
    <SettingsSection
      heading="App Version"
      controlArea={!data?.semVerUpdateType ? statusContent : undefined}
    >
      <Paragraph>
        You are currently running Fresco v.{env.APP_VERSION} ({env.COMMIT_HASH}
        ).
      </Paragraph>
      <Paragraph>Your unique installation ID is: {installationID}</Paragraph>

      {data?.semVerUpdateType && (
        <>
          <Alert
            variant={data.semVerUpdateType === 'major' ? 'default' : 'info'}
            className="mt-4"
          >
            <AlertTitle>
              {' '}
              <div className="mt-4 flex flex-row items-center space-x-2">
                <Info className="h-8 w-8 text-info" />
                <Paragraph
                  className="text-info"
                  variant="smallText"
                  margin="none"
                >
                  A new version of Fresco is available: {data.newVersion}
                </Paragraph>
              </div>
            </AlertTitle>
            <AlertDescription>
              <Paragraph>
                To upgrade your Fresco version, you will need to sync your fork
                with the latest version of the Fresco repository. For more
                information, please refer to the{' '}
                <Link href="https://documentation.networkcanvas.com/en/fresco/deployment/upgrading">
                  upgrade documentation.
                </Link>
              </Paragraph>

              <Paragraph>
                {data.semVerUpdateType && (
                  <Alert
                    variant={
                      data.semVerUpdateType === 'major'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    <AlertTitle>
                      {updateTypeMessages[data.semVerUpdateType].label}
                    </AlertTitle>
                    <AlertDescription>
                      {updateTypeMessages[data.semVerUpdateType].message}
                    </AlertDescription>
                  </Alert>
                )}
              </Paragraph>

              <Paragraph>
                <article className="prose prose-a:text-blue-600 prose-headings:text-sm prose-headings:text-foreground prose-headings:font-extrabold prose-headings:foreground prose-headings:tracking-widest prose-headings:uppercase text-sm text-foreground">
                  <Markdown>{data.releaseNotes}</Markdown>
                </article>
              </Paragraph>
            </AlertDescription>
          </Alert>
        </>
      )}
    </SettingsSection>
  );
}
