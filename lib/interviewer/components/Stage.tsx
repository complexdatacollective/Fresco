import type { Stage as TStage } from '@codaco/protocol-validation';
import { type ElementType } from 'react';
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
    <div
      className="flex size-full flex-col items-center"
      id="stage"
      key={stage.id}
    >
      <StageErrorBoundary>
        {CurrentInterface && (
          <CurrentInterface
            key={stage.id}
            registerBeforeNext={registerBeforeNext}
            stage={stage}
            getNavigationHelpers={getNavigationHelpers}
          />
        )}
      </StageErrorBoundary>
    </div>
  );
}

export default Stage;
