import type { Stage as TStage } from '@codaco/protocol-validation';

export type Direction = 'forwards' | 'backwards';

export type BeforeNextFunction = (
  direction: Direction,
) => Promise<boolean | 'FORCE'> | boolean | 'FORCE';

export type StageProps<T extends TStage['type'] = TStage['type']> = {
  stage: Extract<TStage, { type: T }>;
  registerBeforeNext: (fn: BeforeNextFunction | null) => void;
  getNavigationHelpers: () => {
    moveForward: () => void;
    moveBackward: () => void;
  };
};
