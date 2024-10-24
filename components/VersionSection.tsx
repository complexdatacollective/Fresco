'use client';

import { CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/Alert';
import { env } from '~/env';
import { type getInstallationId } from '~/queries/appSettings';
import { ensureError } from '~/utils/ensureError';
import SettingsSection from './layout/SettingsSection';
import Paragraph from './ui/typography/Paragraph';

const GithubApiResponseSchema = z.object({
  status: z.string(),
  ahead_by: z.number(),
  behind_by: z.number(),
  base_commit: z.object({
    sha: z.string(),
  }),
});

const GithubApiTagSchema = z.array(
  z.object({
    commit: z.object({
      sha: z.string(),
    }),
    name: z.string(),
  }),
);

function getSemverUpdateType(
  currentVersion: string,
  mainVersion: string,
): 'major' | 'minor' | 'patch' | 'same' {
  if (currentVersion === mainVersion) return 'same';

  const [currentMajor, currentMinor, currentPatch] = currentVersion.split('.');
  const [mainMajor, mainMinor, mainPatch] = mainVersion.split('.');

  if (mainMajor !== currentMajor) return 'major';
  if (mainMinor !== currentMinor) return 'minor';
  if (mainPatch !== currentPatch) return 'patch';

  return 'same';
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
    upToDate: boolean;
    aheadBy: number;
    behindBy: number;
    semVerUpdateType: 'major' | 'minor' | 'patch' | 'same';
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      fetch(
        `https://api.github.com/repos/complexdatacollective/fresco/compare/${env.COMMIT_HASH}...main`,
      )
        .then((res) => res.json())
        .then((result) => GithubApiResponseSchema.parse(result)),
      fetch(`https://api.github.com/repos/complexdatacollective/fresco/tags`)
        .then((res) => res.json())
        .then((result) => GithubApiTagSchema.parse(result)),
    ])
      .then(([compareResponse, tags]) => {
        const mainTag = tags.find(
          (tag) => tag.commit.sha === compareResponse.base_commit.sha,
        );

        const mainVersion = mainTag.name.replace(/^v/, '');

        setData({
          upToDate:
            compareResponse.status === 'identical' ||
            compareResponse.status === 'behind',
          aheadBy: compareResponse.ahead_by,
          behindBy: compareResponse.behind_by,
          semVerUpdateType: getSemverUpdateType(mainVersion, env.APP_VERSION),
        });
      })
      .catch((error) => {
        const e = ensureError(error);
        setError(e.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <SettingsSection
      heading="App Version"
      controlArea={
        <div className="flex max-w-52 flex-1 flex-col items-center justify-center text-center">
          {isLoading && (
            <div className="flex flex-col items-center space-x-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <Paragraph variant="smallText" margin="none">
                Checking for updates...
              </Paragraph>
            </div>
          )}
          {!isLoading && data?.upToDate === false && (
            <div className="flex flex-col items-center space-x-2">
              <Info className="h-8 w-8 fill-info text-info-foreground" />
              <Paragraph
                className="text-info"
                variant="smallText"
                margin="none"
              >
                A new version of Fresco is available! You are{' '}
                {data?.aheadBy ?? 0}{' '}
                {data?.aheadBy === 1 ? 'commit' : 'commits'} behind.
              </Paragraph>
            </div>
          )}
          {!isLoading && data?.upToDate === true && (
            <div className="flex flex-col items-center space-x-2">
              <CheckCircle2 className="h-8 w-8 fill-success text-success-foreground" />
              <Paragraph variant="smallText" margin="none">
                You are up to date!
              </Paragraph>
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center space-x-2">
              <XCircle className="h-8 w-8 fill-destructive text-destructive-foreground" />
              <Paragraph
                className="text-destructive"
                variant="smallText"
                margin="none"
              >
                There was an error checking for updates.
              </Paragraph>
            </div>
          )}
        </div>
      }
    >
      <Paragraph>
        You are currently running Fresco v.{env.APP_VERSION} ({env.COMMIT_HASH}
        ).
      </Paragraph>
      <Paragraph>Your unique installation ID is: {installationID}</Paragraph>
      {data?.semVerUpdateType === 'major' && <MajorVersionAlert />}
      {data?.semVerUpdateType === 'minor' && <MinorVersionAlert />}
      {data?.semVerUpdateType === 'patch' && <PatchVersionAlert />}
    </SettingsSection>
  );
}

const MajorVersionAlert = () => {
  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle>Warning:</AlertTitle>
      <AlertDescription>
        A major version bump will require additional configuration work, and
        should NOT be done while collecting data. If you are actively collecting
        data, please wait until data collection is complete before updating.
      </AlertDescription>
    </Alert>
  );
};

const MinorVersionAlert = () => {
  return (
    <Alert variant="info" className="mt-4">
      <AlertTitle>Note:</AlertTitle>
      <AlertDescription>
        A minor version bump will add new features. Please review the release
        notes and update.
      </AlertDescription>
    </Alert>
  );
};

const PatchVersionAlert = () => {
  return (
    <Alert variant="info" className="mt-4">
      <AlertTitle>Note:</AlertTitle>
      <AlertDescription>
        A patch version bump will include bug fixes. We recommend updating to
        all patch versions.
      </AlertDescription>
    </Alert>
  );
};
