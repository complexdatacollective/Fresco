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
};

function Stage(props: StageProps) {
  const CurrentInterface = getInterface(
    props.stage.type,
  ) as unknown as ElementType<StageProps>;

  return (
    <div
      className="flex-grow-1 relative h-full w-full basis-full overflow-hidden"
      id="stage"
    >
      <StageErrorBoundary>
        {CurrentInterface && (
          <CurrentInterface
            key={props.stage.id}
            registerBeforeNext={props.registerBeforeNext}
            stage={props.stage}
          />
        )}
      </StageErrorBoundary>
    </div>
  );
}

export default memo(Stage);
