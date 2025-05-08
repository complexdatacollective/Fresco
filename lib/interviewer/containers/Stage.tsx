import type { Stage as TStage } from '@codaco/protocol-validation';
import { type ElementType, memo } from 'react';
import StageErrorBoundary from '../components/StageErrorBoundary';
import getInterface from './Interfaces';
import type { BeforeNextFunction } from './ProtocolScreen';

export interface StageProps {
  stage: TStage;
  registerBeforeNext: (fn: BeforeNextFunction | null) => void;
  getNavigationHelpers: () => {
    moveForward: () => void;
    moveBackward: () => void;
  };
}

function Stage(props: StageProps) {
  const { stage, registerBeforeNext, getNavigationHelpers } = props;

  const CurrentInterface = getInterface(
    stage.type,
  ) as unknown as ElementType<StageProps>;

  return (
    <div
      className="relative flex h-full w-full flex-grow-1 basis-full overflow-hidden"
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

export default memo(Stage);
