'use client';

import { useRouter } from 'next/navigation';
import { env } from '~/env.js';
import InterviewShell from '~/lib/interviewer/InterviewShell';
import type { InterviewPayload } from '~/lib/interviewer/contract/types';

type Props = {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
};

export default function InterviewClient({ payload, assetUrls }: Props) {
  const router = useRouter();

  return (
    <InterviewShell
      payload={payload}
      onSync={async (id, session) => {
        const response = await fetch(`/interview/${id}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session),
        });
        if (!response.ok) throw new Error('Sync failed');
      }}
      onFinish={async (id, signal) => {
        const response = await fetch(`/api/interviews/${id}/finish`, {
          method: 'POST',
          signal,
        });
        if (!response.ok) throw new Error('Failed to finish interview');
        router.push('/interview/finished');
      }}
      onRequestAsset={(assetId) => {
        const url = assetUrls[assetId];
        if (!url)
          return Promise.reject(new Error(`No URL for asset ${assetId}`));
        return Promise.resolve(url);
      }}
      flags={{
        isE2E: env.NEXT_PUBLIC_E2E_TEST,
        isDevelopment: env.NODE_ENV === 'development',
      }}
    />
  );
}
