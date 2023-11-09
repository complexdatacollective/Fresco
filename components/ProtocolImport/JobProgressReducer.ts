export type ProgressItem = {
  label: string;
  complete: boolean;
  active: boolean;
  progress?: number;
};

export const importSteps = [
  'Extracting protocol',
  'Validating protocol',
  'Uploading assets',
  'Finishing up',
] as const;

export type ImportStep = (typeof importSteps)[number];

export type JobStatusState = {
  activeStep: ImportStep | null;
  progress?: number;
};

export const jobStatusInitialState: JobStatusState = {
  activeStep: null,
};

export type JobStatusAction = {
  type: 'UPDATE_STATUS';
  payload: {
    activeStep: ImportStep;
    progress?: number;
  };
};

export function jobStatusReducer(
  state: JobStatusState,
  action?: JobStatusAction,
) {
  switch (action?.type) {
    case 'UPDATE_STATUS': {
      const { activeStep } = action.payload;

      if (!action.payload.progress) {
        return { activeStep };
      }

      return {
        activeStep,
        progress: action.payload.progress,
      };
    }
    default:
      return state;
  }
}
