'use client';

import { useRouter } from 'next/navigation';
import { parseAsInteger, useQueryState } from 'nuqs';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Shell,
  type AssetRequestHandler,
  type FinishHandler,
  type InterviewAnalyticsMetadata,
  type InterviewPayload,
  type StepChangeHandler,
} from '@codaco/interview';
import InterviewCompleted from '~/app/(interview)/interview/_components/InterviewCompleted';
import { env } from '~/env.js';
import { POSTHOG_APP_NAME, POSTHOG_APP_VERSION } from '~/fresco.config';

import { createInterviewSyncHandler } from './createInterviewSyncHandler';

type Props = {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
  initialStep: number;
  initialSyncRevision: number;
  installationId: string;
  disableAnalytics: boolean;
};

export default function InterviewClient({
  payload,
  assetUrls,
  initialStep,
  initialSyncRevision,
  installationId,
  disableAnalytics,
}: Props) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useQueryState(
    'step',
    parseAsInteger.withDefault(initialStep).withOptions({ history: 'push' }),
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

  const onSync = useMemo(
    () =>
      createInterviewSyncHandler({
        interviewId: payload.session.id,
        initialSyncRevision,
        // Read through the ref, not the render's value: the memo runs once, and
        // the step a write should record is the one in force when it goes on
        // the wire.
        getCurrentStep: () => currentStepRef.current,
      }),
    [payload.session.id, initialSyncRevision],
  );

  const [finished, setFinished] = useState(false);

  const onFinish = useCallback<FinishHandler>(
    async (id, signal) => {
      const response = await fetch(`/api/interviews/${id}/finish`, {
        method: 'POST',
        signal,
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error('Your interview could not be submitted.');
      }

      setFinished(true);

      router.replace('/interview/finished');
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
      isDevelopment: env.NODE_ENV === 'development',
    }),
    [],
  );

  const analytics = useMemo<InterviewAnalyticsMetadata>(
    () => ({
      installationId,
      hostApp: POSTHOG_APP_NAME,
      hostVersion: POSTHOG_APP_VERSION,
    }),
    [installationId],
  );

  if (finished) {
    return <InterviewCompleted />;
  }

  return (
    <Shell
      payload={payload}
      currentStep={currentStep}
      onStepChange={onStepChange}
      onSync={onSync}
      onFinish={onFinish}
      onRequestAsset={onRequestAsset}
      flags={flags}
      analytics={analytics}
      posthogClient={posthog}
      disableAnalytics={disableAnalytics}
      allowUserScaling
    />
  );
}
