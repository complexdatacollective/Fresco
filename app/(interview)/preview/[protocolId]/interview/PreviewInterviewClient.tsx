'use client';

import { env } from '~/env.js';
import InterviewShell from '~/lib/interviewer/InterviewShell';
import type { InterviewPayload } from '~/lib/interviewer/contract/types';

type Props = {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
};

export default function PreviewInterviewClient({ payload, assetUrls }: Props) {
  return (
    <InterviewShell
      payload={payload}
      onSync={() => Promise.resolve()}
      onFinish={() => {
        window.close();
        return Promise.resolve();
      }}
      onRequestAsset={(assetId) => {
        const url = assetUrls[assetId];
        if (!url)
          return Promise.reject(new Error(`No URL for asset ${assetId}`));
        return Promise.resolve(url);
      }}
      flags={{ isE2E: env.NEXT_PUBLIC_E2E_TEST === true }}
    />
  );
}
