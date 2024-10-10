'use client';

import { CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { z } from 'zod';
import { env } from '~/env';
import { type getAppSetting } from '~/queries/appSettings';
import { ensureError } from '~/utils/ensureError';
import SettingsSection from './layout/SettingsSection';
import Paragraph from './ui/typography/Paragraph';

const GithubApiResponseSchema = z.object({
  status: z.string(),
  ahead_by: z.number(),
  behind_by: z.number(),
});

export default function VersionSection({
  installationIdPromise,
}: {
  installationIdPromise: ReturnType<typeof getAppSetting>;
}) {
  const installationID = use(installationIdPromise);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    upToDate: boolean;
    aheadBy: number;
    behindBy: number;
  } | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(
      `https://api.github.com/repos/complexdatacollective/fresco/compare/${env.COMMIT_HASH}...main`,
    )
      .then((res) => res.json())
      .then(
        (result: unknown) => {
          setIsLoading(false);

          const response = GithubApiResponseSchema.parse(result);
          setData({
            upToDate:
              response.status === 'identical' || response.status === 'behind',
            aheadBy: response.ahead_by,
            behindBy: response.behind_by,
          });
        },
        (error) => {
          const e = ensureError(error);
          setIsLoading(false);
          setError(e.message);
        },
      );
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
    </SettingsSection>
  );
}
