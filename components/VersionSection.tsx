'use client';

import { env } from '~/env.mjs';
import SettingsSection from './layout/SettingsSection';
import Paragraph from './ui/typography/Paragraph';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';

const GithubApiResponseSchema = z.object({
  status: z.string(),
  ahead_by: z.number(),
  behind_by: z.number(),
});

// Use the github API to compare the current COMMIT_HASH against the head of the repo
const checkIfUpdateAvailable = async () => {
  try {
    const res = await fetch(
      `https://api.github.com/repos/complexdatacollective/fresco/compare/${env.COMMIT_HASH}...main`,
    );
    const raw = await res.json();

    const data = GithubApiResponseSchema.parse(raw);

    return {
      upToDate: data.status === 'identical',
      aheadBy: data.ahead_by,
      behindBy: data.behind_by,
      error: null,
    };
  } catch (e) {
    return {
      upToDate: null,
      aheadBy: null,
      behindBy: null,
      error: e,
    };
  }
};

export default function VersionSection() {
  const { isLoading, data, isError } = useQuery({
    queryKey: ['repoData'],
    queryFn: checkIfUpdateAvailable,
  });

  return (
    <SettingsSection
      heading="App Version"
      controlArea={
        <div className="flex w-52 flex-col items-center justify-center text-center">
          {isLoading && (
            <div className="flex flex-col items-center space-x-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <Paragraph variant="smallText" margin="none">
                Checking for updates...
              </Paragraph>
            </div>
          )}
          {data?.upToDate === false && (
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
          {data?.upToDate === true && (
            <div className="flex flex-col items-center space-x-2">
              <CheckCircle2 className="h-8 w-8 fill-success text-success-foreground" />
              <Paragraph variant="smallText" margin="none">
                You are up to date!
              </Paragraph>
            </div>
          )}
          {isError && (
            <div className="flex flex-col items-center space-x-2">
              <XCircle className="h-8 w-8 fill-destructive text-destructive-foreground" />
              <Paragraph
                className="text-destructive "
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
        You are currently running Fresco v.{env.APP_VERSION} ({env.COMMIT_HASH})
      </Paragraph>
    </SettingsSection>
  );
}
