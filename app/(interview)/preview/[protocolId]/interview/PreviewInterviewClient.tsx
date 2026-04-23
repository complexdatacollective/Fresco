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
      onSync={async () => {}}
      onFinish={async () => {
        window.close();
      }}
      onRequestAsset={async (assetId) => {
        const url = assetUrls[assetId];
        if (!url) throw new Error(`No URL for asset ${assetId}`);
        return url;
      }}
      flags={{ isE2E: env.NEXT_PUBLIC_E2E_TEST === true }}
    />
  );
}
