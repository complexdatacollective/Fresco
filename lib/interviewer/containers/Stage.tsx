import getInterface from './Interfaces';
import StageErrorBoundary from '../components/StageErrorBoundary';
import { type ElementType, memo } from 'react';
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

function Stage(props: StageProps) {
  const { stage, registerBeforeNext, getNavigationHelpers } = props;

  const CurrentInterface = getInterface(
    stage.type,
  ) as unknown as ElementType<StageProps>;

  return (
    <div
      className="relative flex h-full w-full flex-grow-1 basis-full overflow-hidden"
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
