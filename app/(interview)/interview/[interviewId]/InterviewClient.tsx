'use client';

import {
  Shell,
  type AssetRequestHandler,
  type FinishHandler,
  type InterviewPayload,
  type StepChangeHandler,
  type SyncHandler,
} from '@codaco/interview';
import { useRouter } from 'next/navigation';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { env } from '~/env.js';

type Props = {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
  initialStep: number;
};

export default function InterviewClient({
  payload,
  assetUrls,
  initialStep,
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(initialStep),
  );

  // Refs let onSync read the latest values even though the package's sync
  // middleware captures the handler once at store creation time.
  const currentStepRef = useRef(currentStep);
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const assetUrlsRef = useRef(assetUrls);
  useEffect(() => {
    assetUrlsRef.current = assetUrls;
  }, [assetUrls]);

  const onStepChange = useCallback<StepChangeHandler>(
    (step) => {
      void setCurrentStep(step);
    },
    [setCurrentStep],
  );

  const onSync = useCallback<SyncHandler>(async (id, session) => {
    const response = await fetch(`/interview/${id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...session,
        currentStep: currentStepRef.current,
      }),
    });
    if (!response.ok) throw new Error('Sync failed');
  }, []);

  const onFinish = useCallback<FinishHandler>(
    async (id, signal) => {
      const response = await fetch(`/api/interviews/${id}/finish`, {
        method: 'POST',
        signal,
      });
      if (!response.ok) throw new Error('Failed to finish interview');
      router.push('/interview/finished');
    },
    [router],
  );

  const onRequestAsset = useCallback<AssetRequestHandler>((assetId) => {
    const url = assetUrlsRef.current[assetId];
    if (!url) return Promise.reject(new Error(`No URL for asset ${assetId}`));
    return Promise.resolve(url);
  }, []);

  const flags = useMemo(
    () => ({
      isE2E: env.NEXT_PUBLIC_E2E_TEST,
      isDevelopment: env.NODE_ENV === 'development',
    }),
    [],
  );

  return (
    <Shell
      payload={payload}
      currentStep={currentStep}
      onStepChange={onStepChange}
      onSync={onSync}
      onFinish={onFinish}
      onRequestAsset={onRequestAsset}
      flags={flags}
    />
  );
}
