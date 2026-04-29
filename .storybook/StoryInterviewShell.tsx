'use client';
'use no memo';

import { type Middleware } from '@reduxjs/toolkit';
import { AnimatePresence, motion } from 'motion/react';
import {
  type ElementType,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import SuperJSON from 'superjson';
import DialogProvider from '~/components/ui/dialogs/DialogProvider';
import useMediaQuery from '~/hooks/useMediaQuery';
import { InterviewToastProvider } from '~/lib/interviewer/components/InterviewToast';
import Navigation from '~/lib/interviewer/components/Navigation';
import StageErrorBoundary from '~/lib/interviewer/components/StageErrorBoundary';
import { isValidAssetType } from '~/lib/interviewer/contract/assets';
import { ContractProvider } from '~/lib/interviewer/contract/context';
import type {
  InterviewPayload,
  ResolvedAsset,
} from '~/lib/interviewer/contract/types';
import { StageMetadataProvider } from '~/lib/interviewer/contexts/StageMetadataContext';
import {
  updatePrompt,
  updateStage,
} from '~/lib/interviewer/ducks/modules/session';
import useReadyForNextStage from '~/lib/interviewer/hooks/useReadyForNextStage';
import getInterface from '~/lib/interviewer/Interfaces';
import {
  getCurrentStage,
  getNavigationInfo,
  getPromptCount,
  getStageCount,
} from '~/lib/interviewer/selectors/session';
import { getNavigableStages } from '~/lib/interviewer/selectors/skip-logic';
import { calculateProgress } from '~/lib/interviewer/selectors/utils';
import { store } from '~/lib/interviewer/store';
import {
  type BeforeNextFunction,
  type Direction,
  type RegisterBeforeNext,
  type StageProps,
} from '~/lib/interviewer/types';
import { cx } from '~/utils/cva';

const variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { when: 'beforeChildren' } },
  exit: { opacity: 0, transition: { when: 'afterChildren' } },
};

function StoryInterview() {
  const dispatch = useDispatch();

  const [forceNavigationDisabled, setForceNavigationDisabled] = useState(false);
  const [showStage, setShowStage] = useState(false);
  const pendingStepRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);

  useLayoutEffect(() => {
    setShowStage(true);
  }, []);

  const stage = useSelector(getCurrentStage);
  const CurrentInterface = stage
    ? (getInterface(stage.type) as ElementType<StageProps>)
    : null;

  const { isReady: isReadyForNextStage } = useReadyForNextStage();
  const { currentStep, isLastPrompt, isFirstPrompt, promptIndex } =
    useSelector(getNavigationInfo);
  const { nextValidStageIndex, previousValidStageIndex } =
    useSelector(getNavigableStages);
  const stageCount = useSelector(getStageCount);
  const promptCount = useSelector(getPromptCount);

  const nextValidStageIndexRef = useRef(nextValidStageIndex);
  const previousValidStageIndexRef = useRef(previousValidStageIndex);
  nextValidStageIndexRef.current = nextValidStageIndex;
  previousValidStageIndexRef.current = previousValidStageIndex;

  const [progress, setProgress] = useState(
    calculateProgress(currentStep, stageCount, promptIndex, promptCount),
  );

  const beforeNextHandlers = useRef(new Map<string, BeforeNextFunction>());
  const registerBeforeNext: RegisterBeforeNext = useCallback(
    (
      ...args: [BeforeNextFunction | null] | [string, BeforeNextFunction | null]
    ) => {
      if (args.length === 1) {
        const [fn] = args;
        if (fn === null) {
          beforeNextHandlers.current.clear();
        } else {
          beforeNextHandlers.current.set('default', fn);
        }
      } else {
        const [key, fn] = args;
        if (fn === null) {
          beforeNextHandlers.current.delete(key);
        } else {
          beforeNextHandlers.current.set(key, fn);
        }
      }
    },
    [],
  ) as RegisterBeforeNext;

  const canNavigate = async (direction: Direction) => {
    const handlers = beforeNextHandlers.current;
    if (handlers.size === 0) return true;

    let hasForce = false;
    for (const fn of handlers.values()) {
      const result = await fn(direction);
      if (result === false) return false;
      if (result === 'FORCE') hasForce = true;
    }
    return hasForce ? 'FORCE' : true;
  };

  const navigateToStep = useCallback(
    (targetStep: number) => {
      setProgress(calculateProgress(targetStep, stageCount, 0, promptCount));
      beforeNextHandlers.current.clear();
      pendingStepRef.current = targetStep;
      isTransitioningRef.current = true;
      setShowStage(false);
    },
    [stageCount, promptCount],
  );

  const moveForward = useCallback(async () => {
    if (isTransitioningRef.current) return;
    setForceNavigationDisabled(true);

    const stageAllowsNavigation = await canNavigate('forwards');
    if (stageAllowsNavigation) {
      if (stageAllowsNavigation !== 'FORCE' && !isLastPrompt) {
        dispatch(updatePrompt(promptIndex + 1));
      } else {
        navigateToStep(nextValidStageIndexRef.current);
      }
    }

    setForceNavigationDisabled(false);
  }, [dispatch, isLastPrompt, promptIndex, navigateToStep]);

  const moveBackward = useCallback(async () => {
    if (isTransitioningRef.current) return;
    setForceNavigationDisabled(true);

    const stageAllowsNavigation = await canNavigate('backwards');
    if (stageAllowsNavigation) {
      if (stageAllowsNavigation !== 'FORCE' && !isFirstPrompt) {
        dispatch(updatePrompt(promptIndex - 1));
      } else {
        navigateToStep(previousValidStageIndexRef.current);
      }
    }

    setForceNavigationDisabled(false);
  }, [dispatch, isFirstPrompt, promptIndex, navigateToStep]);

  const getNavigationHelpers = useCallback(
    () => ({ moveForward, moveBackward }),
    [moveForward, moveBackward],
  );

  const handleExitComplete = useCallback(() => {
    const target = pendingStepRef.current;
    if (target === null) return;

    beforeNextHandlers.current.clear();
    dispatch(updateStage(target));
    pendingStepRef.current = null;
    setShowStage(true);
    isTransitioningRef.current = false;
  }, [dispatch]);

  const forwardButtonRef = useRef<HTMLButtonElement>(null);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const isPortraitAspectRatio = useMediaQuery('(max-aspect-ratio: 3/4)');
  const navigationOrientation = isPortraitAspectRatio
    ? 'horizontal'
    : 'vertical';

  const { canMoveForward, canMoveBackward } = useSelector(getNavigationInfo);

  return (
    <div
      className={cx(
        'relative flex size-full flex-1 overflow-hidden',
        isPortraitAspectRatio ? 'flex-col' : 'flex-row-reverse',
      )}
    >
      <StageMetadataProvider value={registerBeforeNext}>
        <InterviewToastProvider
          forwardButtonRef={forwardButtonRef}
          backButtonRef={backButtonRef}
          orientation={navigationOrientation}
        >
          <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
            {showStage && stage && (
              <motion.div
                key={currentStep}
                className="flex min-h-0 flex-1"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={variants}
              >
                <div
                  className="flex size-full flex-col items-center justify-center"
                  id="stage"
                  key={stage.id}
                >
                  <StageErrorBoundary>
                    {CurrentInterface && (
                      <CurrentInterface
                        key={stage.id}
                        stage={stage}
                        getNavigationHelpers={getNavigationHelpers}
                      />
                    )}
                  </StageErrorBoundary>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </InterviewToastProvider>
      </StageMetadataProvider>
      <Navigation
        moveBackward={moveBackward}
        moveForward={moveForward}
        disableMoveForward={
          forceNavigationDisabled || !showStage || !canMoveForward
        }
        disableMoveBackward={
          forceNavigationDisabled ||
          !showStage ||
          (!canMoveBackward && beforeNextHandlers.current.size === 0)
        }
        pulseNext={isReadyForNextStage}
        progress={progress}
        orientation={navigationOrientation}
        forwardButtonRef={forwardButtonRef}
        backButtonRef={backButtonRef}
      />
    </div>
  );
}

function inferAssetType(asset: Record<string, unknown>): ResolvedAsset['type'] {
  const t = asset.type;
  if (typeof t === 'string' && isValidAssetType(t)) {
    return t;
  }
  if (typeof asset.value === 'string') return 'apikey';
  if (typeof asset.url === 'string' && asset.url.endsWith('.geojson'))
    return 'geojson';
  return 'network';
}

type RawAsset = Record<string, unknown>;

type RawSyntheticPayload = {
  id: string;
  startTime: Date;
  finishTime: Date | null;
  exportTime: Date | null;
  lastUpdated: Date;
  currentStep: number;
  stageMetadata?: unknown;
  network: InterviewPayload['session']['network'];
  protocol: {
    id: string;
    schemaVersion: number;
    codebook: unknown;
    stages: unknown[];
    assets: RawAsset[];
    name: string;
    description: string | null;
    importedAt: Date;
    isPreview: boolean;
    isPending: boolean;
    experiments: unknown;
  };
};

function buildInterviewPayload(raw: RawSyntheticPayload): {
  payload: InterviewPayload;
  assetUrls: Record<string, string>;
} {
  const { protocol, stageMetadata, ...sessionFields } = raw;

  const assets: ResolvedAsset[] = protocol.assets.flatMap((a) => {
    const assetId = typeof a.assetId === 'string' ? a.assetId : null;
    if (!assetId) return [];
    return [
      {
        assetId,
        name: typeof a.name === 'string' ? a.name : assetId,
        type: inferAssetType(a),
        value: typeof a.value === 'string' ? a.value : undefined,
      },
    ];
  });

  const assetUrls: Record<string, string> = {};
  for (const a of protocol.assets) {
    const id = typeof a.assetId === 'string' ? a.assetId : null;
    if (id && typeof a.url === 'string') {
      assetUrls[id] = a.url;
    }
  }

  const payload: InterviewPayload = {
    session: {
      id: sessionFields.id,
      startTime: sessionFields.startTime.toISOString(),
      finishTime: sessionFields.finishTime?.toISOString() ?? null,
      exportTime: sessionFields.exportTime?.toISOString() ?? null,
      lastUpdated: sessionFields.lastUpdated.toISOString(),
      currentStep: sessionFields.currentStep,
      network: sessionFields.network,
      ...(stageMetadata !== undefined && stageMetadata !== null
        ? {
            stageMetadata:
              stageMetadata as InterviewPayload['session']['stageMetadata'],
          }
        : {}),
    },
    protocol: {
      ...(protocol as Omit<typeof protocol, 'assets' | 'importedAt'>),
      importedAt: protocol.importedAt.toISOString(),
      assets,
    } as InterviewPayload['protocol'],
  };

  return { payload, assetUrls };
}

const StoryInterviewShell = (props: {
  rawPayload: string;
  onAction?: (action: { type: string; payload?: unknown }) => void;
}) => {
  const { payload, assetUrls } = useMemo(() => {
    const raw = SuperJSON.parse<RawSyntheticPayload>(props.rawPayload);
    return buildInterviewPayload(raw);
  }, [props.rawPayload]);

  const onRequestAsset = useCallback(
    (assetId: string) =>
      Promise.resolve(
        assetUrls[assetId] ??
          `data:text/plain;base64,${btoa(`storybook-asset:${assetId}`)}`,
      ),
    [assetUrls],
  );

  const actionMiddleware: Middleware | undefined = useMemo(() => {
    if (!props.onAction) return undefined;
    const callback = props.onAction;
    const middleware: Middleware = () => (next) => (action) => {
      const result = next(action);
      if (
        typeof action === 'object' &&
        action !== null &&
        'type' in action &&
        typeof action.type === 'string'
      ) {
        callback(action as { type: string; payload?: unknown });
      }
      return result;
    };
    return middleware;
  }, [props.onAction]);

  const storeInstance = useMemo(
    () =>
      store(payload, {
        onSync: () => Promise.resolve(),
        extraMiddleware: actionMiddleware ? [actionMiddleware] : undefined,
      }),
    [payload, actionMiddleware],
  );

  return (
    <Provider store={storeInstance}>
      <ContractProvider
        onFinish={() => Promise.resolve()}
        onRequestAsset={onRequestAsset}
        flags={{ isDevelopment: true }}
      >
        {/* Interview-scoped DialogProvider inside the Redux scope —
         * interview dialogs call useSelector and must render under the
         * Provider. See InterviewShell.tsx for the same pattern. */}
        <DialogProvider>
          <StoryInterview />
        </DialogProvider>
      </ContractProvider>
    </Provider>
  );
};

export default StoryInterviewShell;
