'use client';

import {
  Shell,
  type AssetRequestHandler,
  type FinishHandler,
  type InterviewPayload,
  type StepChangeHandler,
  type SyncHandler,
} from '@codaco/interview';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { env } from '~/env.js';

type Props = {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
  initialStep: number;
};

export default function PreviewInterviewClient({
  payload,
  assetUrls,
  initialStep,
}: Props) {
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(initialStep),
  );

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

  const onRequestAsset = useCallback<AssetRequestHandler>((assetId) => {
    const url = assetUrlsRef.current[assetId];
    if (!url) return Promise.reject(new Error(`No URL for asset ${assetId}`));
    return Promise.resolve(url);
  }, []);

  const onSync = useCallback<SyncHandler>(() => Promise.resolve(), []);
  const onFinish = useCallback<FinishHandler>(() => {
    window.close();
    return Promise.resolve();
  }, []);

  const flags = useMemo(
    () => ({
      isE2E: env.NEXT_PUBLIC_E2E_TEST === true,
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
