import { type Stage } from '@codaco/protocol-validation';

export type TieStrengthCensusStage = Stage & {
  introductionPanel: {
    title: string;
    text: string;
  };
};

export type TieStrengthCensusProps = {
  stage: TieStrengthCensusStage;
  registerBeforeNext: (
    callback: (
      direction: 'forwards' | 'backwards',
    ) => Promise<boolean | 'FORCE'> | boolean | 'FORCE',
  ) => void;
  getNavigationHelpers: () => {
    moveForward: () => void;
  };
};
