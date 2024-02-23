import getInterface from './Interfaces';
import StageErrorBoundary from '../components/StageErrorBoundary';
import { type ElementType, memo, useEffect } from 'react';
import { type BeforeNextFunction } from './ProtocolScreen';

type StageProps = {
  stage: {
    id: string;
    type: string;
  };
  registerBeforeNext: (fn: BeforeNextFunction | null) => void;
  getNavigationHelpers: () => {
    moveForward: () => void;
    moveBackward: () => void;
  };
};

function Stage({
  stage,
  registerBeforeNext,
  getNavigationHelpers,
}: StageProps) {
  const CurrentInterface = getInterface(
    stage.type,
  ) as unknown as ElementType<StageProps>;

  useEffect(() => () => registerBeforeNext(null), [registerBeforeNext]);

  return (
    <div
      className="flex-grow-1 relative flex h-full w-full basis-full overflow-hidden"
      id="stage"
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
