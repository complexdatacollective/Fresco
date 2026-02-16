import type { Stage as TStage } from '@codaco/protocol-validation';
import { type ElementType, Suspense } from 'react';
import { Spinner } from '~/lib/legacy-ui/components';
import getInterface from '../Interfaces';
import type { BeforeNextFunction } from './ProtocolScreen';
import StageErrorBoundary from './StageErrorBoundary';

export type StageProps = {
  stage: TStage;
  registerBeforeNext: (fn: BeforeNextFunction | null) => void;
  getNavigationHelpers: () => {
    moveForward: () => void;
    moveBackward: () => void;
  };
};

function Stage(props: StageProps) {
  const { stage, registerBeforeNext, getNavigationHelpers } = props;

  const CurrentInterface = getInterface(stage.type) as ElementType<StageProps>;

  return (
    <div className="flex size-full items-center" id="stage" key={stage.id}>
      <StageErrorBoundary>
        <Suspense
          fallback={
            <div className="flex size-full items-center justify-center">
              <Spinner size="lg" />
            </div>
          }
        >
          {CurrentInterface && (
            <CurrentInterface
              key={stage.id}
              registerBeforeNext={registerBeforeNext}
              stage={stage}
              getNavigationHelpers={getNavigationHelpers}
            />
          )}
        </Suspense>
      </StageErrorBoundary>
    </div>
  );
}

export default Stage;
