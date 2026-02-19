import type { Stage as TStage } from '@codaco/protocol-validation';

export type Direction = 'forwards' | 'backwards';

export type BeforeNextFunction = (
  direction: Direction,
) => Promise<boolean | 'FORCE'> | boolean | 'FORCE';

export type RegisterBeforeNext = {
  (fn: BeforeNextFunction | null): void;
  (key: string, fn: BeforeNextFunction | null): void;
};

export type StageProps<T extends TStage['type'] = TStage['type']> = {
  stage: Extract<TStage, { type: T }>;
  registerBeforeNext: RegisterBeforeNext;
  getNavigationHelpers: () => {
    moveForward: () => void;
    moveBackward: () => void;
  };
};
